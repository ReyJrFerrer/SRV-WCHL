import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Debug "mo:base/Debug";

import Types "../types/shared";
import StaticData "../utils/staticData";

persistent actor RemittanceCanister {
    // Type definitions
    type RemittanceOrder = Types.RemittanceOrder;
    type RemittanceOrderStatus = Types.RemittanceOrderStatus;
    type CommissionRule = Types.CommissionRule;
    type CommissionFormula = Types.CommissionFormula;
    type CommissionQuote = Types.CommissionQuote;
    type PaymentMethod = Types.PaymentMethod;
    type SettlementInstruction = Types.SettlementInstruction;
    type RemittanceOrderFilter = Types.RemittanceOrderFilter;
    type PageRequest = Types.PageRequest;
    type RemittanceOrderPage = Types.RemittanceOrderPage;
    type MediaValidationSummary = Types.MediaValidationSummary;
    type Result<T> = Types.Result<T>;

    // State variables
    private var orderEntries : [(Text, RemittanceOrder)] = [];
    private transient var orders = HashMap.HashMap<Text, RemittanceOrder>(10, Text.equal, Text.hash);
    
    private var ruleEntries : [(Text, CommissionRule)] = [];
    private transient var commissionRules = HashMap.HashMap<Text, CommissionRule>(10, Text.equal, Text.hash);

    // Canister references
    private transient var authCanisterId : ?Principal = null;
    private transient var mediaCanisterId : ?Principal = null;
    private transient var bookingCanisterId : ?Principal = null;
    private transient var serviceCanisterId : ?Principal = null;

    // Settings (would normally come from admin canister)
    private transient var corporateGCashAccount : Text = "09123456789";
    private transient var settlementDeadlineHours : Nat32 = 24;

    // Counter for ensuring unique IDs
    private var idCounter : Nat = 0;

    // Constants
    private transient let MIN_AMOUNT : Nat = 100; // 1 PHP minimum in centavos
    private transient let MAX_AMOUNT : Nat = 1_000_000_00; // 1M PHP maximum in centavos
    private transient let DEFAULT_COMMISSION_RATE : Nat = 300; // 3% in basis points
    private transient let MAX_COMMISSION_RATE : Nat = 1000; // 10% max in basis points

    // Helper functions
    private func generateOrderId() : Text {
        let now = Int.abs(Time.now());
        idCounter += 1;
        return "RMT-" # Int.toText(now) # "-" # Nat.toText(idCounter);
    };

    private func generateDepositRef(branchId: ?Text, orderId: Text) : Text {
        let branch = switch (branchId) {
            case (?id) {
                // Take first 3 chars or full text if shorter
                let chars = Text.toArray(id);
                let takeCount = Nat.min(chars.size(), 3);
                Text.fromArray(Array.tabulate<Char>(takeCount, func(i: Nat): Char { chars[i] }))
            };
            case null "SRV"; // Default branch code
        };
        
        let now = Time.now() / 1_000_000_000; // Convert to seconds
        let date = Int.abs(now) % 100000000; // Get last 8 digits for date
        
        // Take first 4 chars of order ID or full text if shorter
        let orderChars = Text.toArray(orderId);
        let takeCount = Nat.min(orderChars.size(), 4);
        let orderSuffix = Text.fromArray(Array.tabulate<Char>(takeCount, func(i: Nat): Char { orderChars[i] }));
        
        let checksum = (Int.abs(now) % 97) + 1; // Simple checksum
        
        Text.toUppercase(branch) # Int.toText(date) # orderSuffix # Int.toText(checksum)
    };

    private func calculateCommission(amount: Nat, rule: CommissionRule) : Nat {
        switch (rule.formula) {
            case (#Flat(flatAmount)) {
                flatAmount
            };
            case (#Percentage(rateBps)) {
                // Convert basis points to percentage: rateBps / 10000 * amount
                (amount * rateBps) / 10000
            };
            case (#Tiered(tiers)) {
                // Find appropriate tier
                for ((upTo, rateBps) in tiers.vals()) {
                    if (amount <= upTo) {
                        return (amount * rateBps) / 10000;
                    };
                };
                // If no tier found, use last tier rate
                if (tiers.size() > 0) {
                    let lastTier = tiers[tiers.size() - 1];
                    (amount * lastTier.1) / 10000
                } else {
                    DEFAULT_COMMISSION_RATE * amount / 10000
                }
            };
            case (#Hybrid({base; rate_bps})) {
                base + ((amount * rate_bps) / 10000)
            };
        }
    };

    private func applyCommissionCaps(commission: Nat, rule: CommissionRule) : Nat {
        var finalCommission = commission;
        
        // Apply minimum cap
        switch (rule.min_commission) {
            case (?min) {
                if (finalCommission < min) {
                    finalCommission := min;
                };
            };
            case null {};
        };
        
        // Apply maximum cap
        switch (rule.max_commission) {
            case (?max) {
                if (finalCommission > max) {
                    finalCommission := max;
                };
            };
            case null {};
        };
        
        finalCommission
    };

    private func findBestCommissionRule(serviceType: Text, paymentMethod: PaymentMethod) : ?CommissionRule {
        let allRules = Iter.toArray(commissionRules.vals());
        let activeRules = Array.filter<CommissionRule>(allRules, func(rule: CommissionRule) : Bool {
            rule.is_active and Time.now() >= rule.effective_from and
            (switch (rule.effective_to) {
                case (?endTime) Time.now() <= endTime;
                case null true;
            })
        });

        let matchingRules = Array.filter<CommissionRule>(activeRules, func(rule: CommissionRule) : Bool {
            // Check if service type matches
            let serviceTypeMatches = Array.find<Text>(rule.service_types, func(st: Text) : Bool { st == serviceType }) != null;
            
            // Check if payment method matches
            let paymentMethodMatches = Array.find<PaymentMethod>(rule.payment_methods, func(pm: PaymentMethod) : Bool {
                switch (pm, paymentMethod) {
                    case (#CashOnHand, #CashOnHand) true;
                }
            }) != null;
            
            serviceTypeMatches and paymentMethodMatches
        });

        // Sort by priority and return the first one
        let sortedRules = Array.sort<CommissionRule>(matchingRules, func(a: CommissionRule, b: CommissionRule) : {#less; #equal; #greater} {
            if (a.priority < b.priority) #less
            else if (a.priority > b.priority) #greater  
            else #equal
        });

        if (sortedRules.size() > 0) {
            ?sortedRules[0]
        } else {
            null
        }
    };

    private func validateMediaProofs(mediaIds: [Text]) : async Result<[MediaValidationSummary]> {
        if (mediaIds.size() == 0) {
            return #err("At least one proof media is required");
        };

        switch (mediaCanisterId) {
            case (?canisterId) {
                // In a real implementation, we would make inter-canister calls
                // For now, we'll simulate validation
                let validations = Array.map<Text, MediaValidationSummary>(mediaIds, func(mediaId: Text) : MediaValidationSummary {
                    {
                        media_id = mediaId;
                        sha256 = ?"simulated_hash_" # mediaId;
                        mime_type = "image/jpeg";
                        size_bytes = 450000; // Simulated file size
                        uploaded_at = Time.now();
                        extracted_timestamp = null;
                        is_valid_type = true;
                        is_within_size_limit = true;
                        has_text_content = ?true;
                        validation_flags = [];
                    }
                });
                #ok(validations)
            };
            case null {
                #err("Media canister not configured")
            };
        }
    };

    private func isValidStatusTransition(currentStatus: RemittanceOrderStatus, newStatus: RemittanceOrderStatus) : Bool {
        switch (currentStatus, newStatus) {
            case (#AwaitingCash, #CashConfirmed) true;
            case (#AwaitingCash, #Cancelled) true;
            case (#CashConfirmed, #AwaitingSettlement) true;
            case (#CashConfirmed, #Cancelled) true;
            case (#AwaitingSettlement, #Settled) true;
            case (#AwaitingSettlement, #Cancelled) true;
            case (_, _) false; // All other transitions are invalid
        }
    };

    // Initialize static commission rules
    private func initializeStaticCommissionRules() {
        // Default flat commission rule
        let defaultRule : CommissionRule = {
            id = "rule-default-flat";
            version = 1;
            service_types = ["cat-001", "cat-002", "cat-003", "cat-004", "cat-005", "cat-006", "cat-007", "cat-008", "cat-009"]; // All categories
            payment_methods = [#CashOnHand];
            formula = #Percentage(DEFAULT_COMMISSION_RATE); // 3%
            min_commission = ?500; // 5 PHP minimum
            max_commission = ?10000_00; // 100 PHP maximum  
            priority = 100;
            effective_from = 1640995200000000000; // 2022-01-01
            effective_to = null;
            is_active = true;
            created_at = Time.now();
            updated_at = Time.now();
        };
        
        commissionRules.put(defaultRule.id, defaultRule);

        // Premium service higher commission rule
        let premiumRule : CommissionRule = {
            id = "rule-premium-services";
            version = 1;
            service_types = ["cat-005", "cat-007", "cat-009"]; // Beauty, Massage, Photography
            payment_methods = [#CashOnHand];
            formula = #Percentage(500); // 5%
            min_commission = ?1000; // 10 PHP minimum
            max_commission = ?15000_00; // 150 PHP maximum
            priority = 50; // Higher priority than default
            effective_from = 1640995200000000000;
            effective_to = null;
            is_active = true;
            created_at = Time.now();
            updated_at = Time.now();
        };
        
        commissionRules.put(premiumRule.id, premiumRule);
    };

    // Initialization
    system func preupgrade() {
        orderEntries := Iter.toArray(orders.entries());
        ruleEntries := Iter.toArray(commissionRules.entries());
    };

    system func postupgrade() {
        orders := HashMap.fromIter<Text, RemittanceOrder>(orderEntries.vals(), 10, Text.equal, Text.hash);
        orderEntries := [];
        
        commissionRules := HashMap.fromIter<Text, CommissionRule>(ruleEntries.vals(), 10, Text.equal, Text.hash);
        ruleEntries := [];

        // Initialize static rules if empty
        if (commissionRules.size() == 0) {
            initializeStaticCommissionRules();
        };
    };

    // Set canister references
    public shared(msg) func setCanisterReferences(
        auth: ?Principal,
        media: ?Principal,
        booking: ?Principal,
        service: ?Principal
    ) : async Result<Text> {
        // In real implementation, should check admin rights
        authCanisterId := auth;
        mediaCanisterId := media;
        bookingCanisterId := booking;
        serviceCanisterId := service;
        #ok("Canister references set successfully")
    };

    // Quote commission for an amount and service type
    public query func quoteCommission(
        amount: Nat,
        serviceType: Text, 
        paymentMethod: PaymentMethod,
        timestamp: Time.Time
    ) : async Result<CommissionQuote> {
        if (amount < MIN_AMOUNT or amount > MAX_AMOUNT) {
            return #err("Amount must be between " # Nat.toText(MIN_AMOUNT) # " and " # Nat.toText(MAX_AMOUNT) # " centavos");
        };

        switch (findBestCommissionRule(serviceType, paymentMethod)) {
            case (?rule) {
                let baseCommission = calculateCommission(amount, rule);
                let finalCommission = applyCommissionCaps(baseCommission, rule);
                let netProceeds = if (amount >= finalCommission) { amount - finalCommission } else { 0 };
                let effectiveRate = if (amount > 0) { 
                    let commissionInt = Int.abs(finalCommission);
                    let amountInt = Int.abs(amount);
                    if (amountInt > 0) {
                        Float.fromInt(commissionInt * 10000 / amountInt) / 100.0
                    } else {
                        0.0
                    }
                } else { 
                    0.0 
                };

                #ok({
                    rule_id = rule.id;
                    rule_version = rule.version;
                    commission = finalCommission;
                    net = netProceeds;
                    effective_rate = effectiveRate;
                })
            };
            case null {
                #err("No commission rule found for service type: " # serviceType # " and payment method")
            };
        }
    };

    // Create a new remittance order
    public shared(msg) func createOrder(input: {
        customer_id: Principal;
        amount: Nat;
        service_type: Text;
        service_id: ?Text;
        booking_id: ?Text;
        collector_id: Principal;
        branch_id: ?Text;
    }) : async Result<RemittanceOrder> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // Validate amount
        if (input.amount < MIN_AMOUNT or input.amount > MAX_AMOUNT) {
            return #err("Amount must be between " # Nat.toText(MIN_AMOUNT) # " and " # Nat.toText(MAX_AMOUNT) # " centavos");
        };

        // Get commission quote
        let paymentMethod = #CashOnHand;
        let quoteResult = await quoteCommission(input.amount, input.service_type, paymentMethod, Time.now());
        
        let quote = switch (quoteResult) {
            case (#ok(q)) q;
            case (#err(msg)) return #err("Commission calculation failed: " # msg);
        };

        let orderId = generateOrderId();
        let now = Time.now();
        
        let newOrder : RemittanceOrder = {
            id = orderId;
            customer_id = input.customer_id;
            amount_php_centavos = input.amount;
            service_type = input.service_type;
            service_id = input.service_id;
            booking_id = input.booking_id;
            payment_method = paymentMethod;
            collector_id = input.collector_id;
            branch_id = input.branch_id;
            status = #AwaitingCash;
            commission_rule_id = quote.rule_id;
            commission_version = quote.rule_version;
            commission_amount = quote.commission;
            net_proceeds = quote.net;
            deposit_ref = null;
            gcash_ref = null;
            proof_cash_media_ids = [];
            proof_settlement_media_ids = [];
            created_at = now;
            cash_confirmed_at = null;
            settled_at = null;
            updated_at = now;
        };

        orders.put(orderId, newOrder);
        #ok(newOrder)
    };

    // Confirm cash received with proof
    public shared(msg) func confirmCashReceived(
        orderId: Text,
        proofs: [Text] // media IDs
    ) : async Result<RemittanceOrder> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (orders.get(orderId)) {
            case (?order) {
                // Check if caller is the collector
                if (order.collector_id != caller) {
                    return #err("Only the assigned collector can confirm cash receipt");
                };

                // Check status transition
                if (not isValidStatusTransition(order.status, #CashConfirmed)) {
                    return #err("Invalid status transition from " # debug_show(order.status) # " to CashConfirmed");
                };

                // Validate proofs
                switch (await validateMediaProofs(proofs)) {
                    case (#ok(validations)) {
                        // Check if all proofs are valid
                        let allValid = Array.foldLeft<MediaValidationSummary, Bool>(validations, true, func(acc, validation) {
                            acc and validation.is_valid_type and validation.is_within_size_limit
                        });

                        if (not allValid) {
                            return #err("One or more proof media files are invalid");
                        };

                        // Generate deposit reference
                        let depositRef = generateDepositRef(order.branch_id, orderId);
                        
                        let updatedOrder : RemittanceOrder = {
                            order with
                            status = #CashConfirmed;
                            deposit_ref = ?depositRef;
                            proof_cash_media_ids = proofs;
                            cash_confirmed_at = ?Time.now();
                            updated_at = Time.now();
                        };

                        orders.put(orderId, updatedOrder);
                        
                        // Auto-transition to awaiting settlement
                        let finalOrder = {
                            updatedOrder with
                            status = #AwaitingSettlement;
                            updated_at = Time.now();
                        };
                        orders.put(orderId, finalOrder);
                        
                        #ok(finalOrder)
                    };
                    case (#err(msg)) {
                        #err("Media validation failed: " # msg)
                    };
                }
            };
            case null {
                #err("Order not found: " # orderId)
            };
        }
    };

    // Generate settlement instruction
    public query func generateSettlementInstruction(orderId: Text) : async Result<SettlementInstruction> {
        switch (orders.get(orderId)) {
            case (?order) {
                switch (order.deposit_ref) {
                    case (?depositRef) {
                        let expiresAt = Time.now() + (Int.abs(Nat32.toNat(settlementDeadlineHours)) * 3600_000_000_000);
                        #ok({
                            deposit_ref = depositRef;
                            expires_at = expiresAt;
                            amount = order.net_proceeds;
                            corporate_gcash_account = corporateGCashAccount;
                            instructions = "Please deposit " # Nat.toText(order.net_proceeds / 100) # " PHP to GCash account " # corporateGCashAccount # " with reference: " # depositRef;
                        })
                    };
                    case null {
                        #err("No deposit reference available. Please confirm cash receipt first.")
                    };
                }
            };
            case null {
                #err("Order not found: " # orderId)
            };
        }
    };

    // Mark order as settled (FINOPS role)
    public shared(msg) func markSettled(
        orderId: Text,
        gcashRef: Text,
        amount: Nat,
        proofs: [Text] // media IDs for settlement proof
    ) : async Result<RemittanceOrder> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // TODO: Check FINOPS role when admin canister is implemented
        
        switch (orders.get(orderId)) {
            case (?order) {
                // Check status transition
                if (not isValidStatusTransition(order.status, #Settled)) {
                    return #err("Invalid status transition from " # debug_show(order.status) # " to Settled");
                };

                // Verify amount matches expected net proceeds
                if (amount != order.net_proceeds) {
                    return #err("Settlement amount " # Nat.toText(amount) # " does not match expected net proceeds " # Nat.toText(order.net_proceeds));
                };

                // Validate settlement proofs
                switch (await validateMediaProofs(proofs)) {
                    case (#ok(validations)) {
                        let allValid = Array.foldLeft<MediaValidationSummary, Bool>(validations, true, func(acc, validation) {
                            acc and validation.is_valid_type and validation.is_within_size_limit
                        });

                        if (not allValid) {
                            return #err("One or more settlement proof media files are invalid");
                        };

                        let updatedOrder : RemittanceOrder = {
                            order with
                            status = #Settled;
                            gcash_ref = ?gcashRef;
                            proof_settlement_media_ids = proofs;
                            settled_at = ?Time.now();
                            updated_at = Time.now();
                        };

                        orders.put(orderId, updatedOrder);
                        #ok(updatedOrder)
                    };
                    case (#err(msg)) {
                        #err("Settlement proof validation failed: " # msg)
                    };
                }
            };
            case null {
                #err("Order not found: " # orderId)
            };
        }
    };

    // Get order by ID
    public query func getOrder(orderId: Text) : async ?RemittanceOrder {
        orders.get(orderId)
    };

    // Query orders with filtering and pagination
    public query func queryOrders(
        filter: RemittanceOrderFilter,
        page: PageRequest
    ) : async RemittanceOrderPage {
        let allOrders = Iter.toArray(orders.vals());
        
        // Apply filters
        var filteredOrders = allOrders;
        
        // Filter by status
        switch (filter.status) {
            case (?statuses) {
                filteredOrders := Array.filter<RemittanceOrder>(filteredOrders, func(order: RemittanceOrder) : Bool {
                    Array.find<RemittanceOrderStatus>(statuses, func(status: RemittanceOrderStatus) : Bool {
                        switch (status, order.status) {
                            case (#AwaitingCash, #AwaitingCash) true;
                            case (#CashConfirmed, #CashConfirmed) true;
                            case (#AwaitingSettlement, #AwaitingSettlement) true;
                            case (#Settled, #Settled) true;
                            case (#Cancelled, #Cancelled) true;
                            case (_, _) false;
                        }
                    }) != null
                });
            };
            case null {};
        };
        
        // Filter by collector
        switch (filter.collector_id) {
            case (?collectorId) {
                filteredOrders := Array.filter<RemittanceOrder>(filteredOrders, func(order: RemittanceOrder) : Bool {
                    order.collector_id == collectorId
                });
            };
            case null {};
        };

        // Filter by date range
        switch (filter.from_date) {
            case (?fromDate) {
                filteredOrders := Array.filter<RemittanceOrder>(filteredOrders, func(order: RemittanceOrder) : Bool {
                    order.created_at >= fromDate
                });
            };
            case null {};
        };
        
        switch (filter.to_date) {
            case (?toDate) {
                filteredOrders := Array.filter<RemittanceOrder>(filteredOrders, func(order: RemittanceOrder) : Bool {
                    order.created_at <= toDate
                });
            };
            case null {};
        };

        // Sort by created_at descending (newest first)
        let sortedOrders = Array.sort<RemittanceOrder>(filteredOrders, func(a: RemittanceOrder, b: RemittanceOrder) : {#less; #equal; #greater} {
            if (a.created_at > b.created_at) #less
            else if (a.created_at < b.created_at) #greater
            else #equal
        });

        // Apply pagination
        let startIndex = switch (page.cursor) {
            case (?cursor) {
                // Simple pagination: cursor is the last order ID seen
                switch (Array.indexOf<RemittanceOrder>({id = cursor; customer_id = Principal.fromText("2vxsx-fae"); amount_php_centavos = 0; service_type = ""; service_id = null; booking_id = null; payment_method = #CashOnHand; collector_id = Principal.fromText("2vxsx-fae"); branch_id = null; status = #AwaitingCash; commission_rule_id = ""; commission_version = 1; commission_amount = 0; net_proceeds = 0; deposit_ref = null; gcash_ref = null; proof_cash_media_ids = []; proof_settlement_media_ids = []; created_at = 0; cash_confirmed_at = null; settled_at = null; updated_at = 0 }, sortedOrders, func(a: RemittanceOrder, b: RemittanceOrder) : Bool { a.id == b.id })) {
                    case (?index) index + 1;
                    case null 0;
                }
            };
            case null 0;
        };

        let pageSize = Nat32.toNat(page.size);
        let endIndex = Nat.min(startIndex + pageSize, sortedOrders.size());
        
        let pageItems = if (startIndex < sortedOrders.size()) {
            Array.tabulate<RemittanceOrder>(endIndex - startIndex, func(i: Nat) : RemittanceOrder {
                sortedOrders[startIndex + i]
            })
        } else {
            []
        };

        let nextCursor = if (endIndex < sortedOrders.size()) {
            ?sortedOrders[endIndex - 1].id
        } else {
            null
        };

        {
            items = pageItems;
            next_cursor = nextCursor;
            total_count = ?sortedOrders.size();
        }
    };

    // Get orders by collector
    public query func getCollectorOrders(collectorId: Principal) : async [RemittanceOrder] {
        let allOrders = Iter.toArray(orders.vals());
        Array.filter<RemittanceOrder>(allOrders, func(order: RemittanceOrder) : Bool {
            order.collector_id == collectorId
        })
    };

    // Get orders by status
    public query func getOrdersByStatus(status: RemittanceOrderStatus) : async [RemittanceOrder] {
        let allOrders = Iter.toArray(orders.vals());
        Array.filter<RemittanceOrder>(allOrders, func(order: RemittanceOrder) : Bool {
            switch (status, order.status) {
                case (#AwaitingCash, #AwaitingCash) true;
                case (#CashConfirmed, #CashConfirmed) true;
                case (#AwaitingSettlement, #AwaitingSettlement) true;
                case (#Settled, #Settled) true;
                case (#Cancelled, #Cancelled) true;
                case (_, _) false;
            }
        })
    };

    // Cancel an order (admin or collector only)
    public shared(msg) func cancelOrder(orderId: Text) : async Result<RemittanceOrder> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        switch (orders.get(orderId)) {
            case (?order) {
                // Check if caller has permission (collector or admin)
                if (order.collector_id != caller) {
                    // TODO: Add admin role check when admin canister is implemented
                    return #err("Only the collector or admin can cancel orders");
                };

                // Check if order can be cancelled
                if (order.status == #Settled) {
                    return #err("Cannot cancel settled orders");
                };

                if (not isValidStatusTransition(order.status, #Cancelled)) {
                    return #err("Invalid status transition from " # debug_show(order.status) # " to Cancelled");
                };

                let updatedOrder : RemittanceOrder = {
                    order with
                    status = #Cancelled;
                    updated_at = Time.now();
                };

                orders.put(orderId, updatedOrder);
                #ok(updatedOrder)
            };
            case null {
                #err("Order not found: " # orderId)
            };
        }
    };

    // Get all commission rules (for admin interface)
    public query func getAllCommissionRules() : async [CommissionRule] {
        Iter.toArray(commissionRules.vals())
    };

    // Add commission rule (placeholder for admin canister functionality)
    public shared(msg) func addCommissionRule(rule: CommissionRule) : async Result<CommissionRule> {
        let caller = msg.caller;
        
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous principal not allowed");
        };

        // TODO: Add admin role check when admin canister is implemented
        
        commissionRules.put(rule.id, rule);
        #ok(rule)
    };

    // Get analytics for collector
    public query func getCollectorAnalytics(
        collectorId: Principal,
        fromDate: ?Time.Time,
        toDate: ?Time.Time
    ) : async {
        total_orders: Nat;
        settled_orders: Nat;
        pending_orders: Nat;
        total_commission_earned: Nat;
        total_amount_collected: Nat;
        average_order_value: Nat;
    } {
        let collectorOrders = Array.filter<RemittanceOrder>(Iter.toArray(orders.vals()), func(order: RemittanceOrder) : Bool {
            var inDateRange = true;
            
            switch (fromDate) {
                case (?from) inDateRange := inDateRange and order.created_at >= from;
                case null {};
            };
            
            switch (toDate) {
                case (?to) inDateRange := inDateRange and order.created_at <= to;
                case null {};
            };
            
            order.collector_id == collectorId and inDateRange
        });

        let totalOrders = collectorOrders.size();
        let settledOrders = Array.filter<RemittanceOrder>(collectorOrders, func(order: RemittanceOrder) : Bool {
            order.status == #Settled
        }).size();
        
        let pendingOrders = Array.filter<RemittanceOrder>(collectorOrders, func(order: RemittanceOrder) : Bool {
            order.status != #Settled and order.status != #Cancelled
        }).size();

        let totalCommissionEarned = Array.foldLeft<RemittanceOrder, Nat>(collectorOrders, 0, func(acc: Nat, order: RemittanceOrder) : Nat {
            if (order.status == #Settled) {
                acc + order.commission_amount
            } else {
                acc
            }
        });

        let totalAmountCollected = Array.foldLeft<RemittanceOrder, Nat>(collectorOrders, 0, func(acc: Nat, order: RemittanceOrder) : Nat {
            if (order.status == #Settled) {
                acc + order.amount_php_centavos
            } else {
                acc
            }
        });

        let averageOrderValue = if (settledOrders > 0) {
            totalAmountCollected / settledOrders
        } else {
            0
        };

        {
            total_orders = totalOrders;
            settled_orders = settledOrders;
            pending_orders = pendingOrders;
            total_commission_earned = totalCommissionEarned;
            total_amount_collected = totalAmountCollected;
            average_order_value = averageOrderValue;
        }
    };
}
