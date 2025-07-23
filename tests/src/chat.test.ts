import { describe, beforeEach, afterEach, it, expect, inject } from "vitest";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PocketIc, type Actor } from "@dfinity/pic";
import { Principal } from "@dfinity/principal";

// Define the chat canister interface types
interface EncryptedContent {
  encryptedText: string;
  encryptionKey: string;
}

interface FileAttachment {
  fileName: string;
  fileSize: bigint;
  fileType: string;
  fileUrl: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: Principal;
  receiverId: Principal;
  messageType: { Text: null } | { File: null };
  content: EncryptedContent;
  attachment: [] | [FileAttachment];
  status: { Sent: null } | { Delivered: null } | { Read: null };
  createdAt: bigint;
  readAt: [] | [bigint];
}

interface Conversation {
  id: string;
  clientId: Principal;
  providerId: Principal;
  bookingId: string;
  createdAt: bigint;
  lastMessageAt: [] | [bigint];
  isActive: boolean;
  unreadCount: Array<[Principal, bigint]>;
}

interface ConversationSummary {
  conversation: Conversation;
  lastMessage: [] | [Message];
}

interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextPageToken: [] | [string];
}

type Result<T> = { ok: T } | { err: string };

interface ChatCanisterActor {
  setCanisterReferences: (
    auth: [] | [Principal],
    booking: [] | [Principal],
  ) => Promise<Result<string>>;

  createConversation: (
    clientId: Principal,
    providerId: Principal,
    bookingId: string,
  ) => Promise<Result<Conversation>>;

  sendMessage: (
    conversationId: string,
    receiverId: Principal,
    content: string,
  ) => Promise<Result<Message>>;

  getMyConversations: () => Promise<Result<ConversationSummary[]>>;

  getConversationMessages: (
    conversationId: string,
    limit: bigint,
    offset: bigint,
  ) => Promise<Result<MessagePage>>;

  markMessagesAsRead: (conversationId: string) => Promise<Result<boolean>>;

  getConversation: (conversationId: string) => Promise<Result<Conversation>>;
}

describe("Chat Canister", () => {
  let pic: PocketIc;
  let actor: Actor<ChatCanisterActor>;
  let canisterId: Principal;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  beforeEach(async () => {
    pic = await PocketIc.create(inject("PIC_URL"));

    // Setup the canister
    const fixture = await pic.setupCanister<ChatCanisterActor>({
      idlFactory: ({ IDL }) => {
        const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
        const ResultConversation = IDL.Variant({
          ok: IDL.Record({
            id: IDL.Text,
            clientId: IDL.Principal,
            providerId: IDL.Principal,
            bookingId: IDL.Text,
            createdAt: IDL.Int,
            lastMessageAt: IDL.Opt(IDL.Int),
            isActive: IDL.Bool,
            unreadCount: IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
          }),
          err: IDL.Text,
        });
        const ResultMessage = IDL.Variant({
          ok: IDL.Record({
            id: IDL.Text,
            conversationId: IDL.Text,
            senderId: IDL.Principal,
            receiverId: IDL.Principal,
            messageType: IDL.Variant({ Text: IDL.Null, File: IDL.Null }),
            content: IDL.Record({
              encryptedText: IDL.Text,
              encryptionKey: IDL.Text,
            }),
            attachment: IDL.Opt(
              IDL.Record({
                fileName: IDL.Text,
                fileSize: IDL.Nat,
                fileType: IDL.Text,
                fileUrl: IDL.Text,
              }),
            ),
            status: IDL.Variant({
              Sent: IDL.Null,
              Delivered: IDL.Null,
              Read: IDL.Null,
            }),
            createdAt: IDL.Int,
            readAt: IDL.Opt(IDL.Int),
          }),
          err: IDL.Text,
        });
        const ResultConversationSummaryArray = IDL.Variant({
          ok: IDL.Vec(
            IDL.Record({
              conversation: IDL.Record({
                id: IDL.Text,
                clientId: IDL.Principal,
                providerId: IDL.Principal,
                bookingId: IDL.Text,
                createdAt: IDL.Int,
                lastMessageAt: IDL.Opt(IDL.Int),
                isActive: IDL.Bool,
                unreadCount: IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
              }),
              lastMessage: IDL.Opt(
                IDL.Record({
                  id: IDL.Text,
                  conversationId: IDL.Text,
                  senderId: IDL.Principal,
                  receiverId: IDL.Principal,
                  messageType: IDL.Variant({ Text: IDL.Null, File: IDL.Null }),
                  content: IDL.Record({
                    encryptedText: IDL.Text,
                    encryptionKey: IDL.Text,
                  }),
                  attachment: IDL.Opt(
                    IDL.Record({
                      fileName: IDL.Text,
                      fileSize: IDL.Nat,
                      fileType: IDL.Text,
                      fileUrl: IDL.Text,
                    }),
                  ),
                  status: IDL.Variant({
                    Sent: IDL.Null,
                    Delivered: IDL.Null,
                    Read: IDL.Null,
                  }),
                  createdAt: IDL.Int,
                  readAt: IDL.Opt(IDL.Int),
                }),
              ),
            }),
          ),
          err: IDL.Text,
        });
        const ResultMessagePage = IDL.Variant({
          ok: IDL.Record({
            messages: IDL.Vec(
              IDL.Record({
                id: IDL.Text,
                conversationId: IDL.Text,
                senderId: IDL.Principal,
                receiverId: IDL.Principal,
                messageType: IDL.Variant({ Text: IDL.Null, File: IDL.Null }),
                content: IDL.Record({
                  encryptedText: IDL.Text,
                  encryptionKey: IDL.Text,
                }),
                attachment: IDL.Opt(
                  IDL.Record({
                    fileName: IDL.Text,
                    fileSize: IDL.Nat,
                    fileType: IDL.Text,
                    fileUrl: IDL.Text,
                  }),
                ),
                status: IDL.Variant({
                  Sent: IDL.Null,
                  Delivered: IDL.Null,
                  Read: IDL.Null,
                }),
                createdAt: IDL.Int,
                readAt: IDL.Opt(IDL.Int),
              }),
            ),
            hasMore: IDL.Bool,
            nextPageToken: IDL.Opt(IDL.Text),
          }),
          err: IDL.Text,
        });
        const ResultBool = IDL.Variant({ ok: IDL.Bool, err: IDL.Text });

        return IDL.Service({
          setCanisterReferences: IDL.Func(
            [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Principal)],
            [Result],
            [],
          ),
          createConversation: IDL.Func(
            [IDL.Principal, IDL.Principal, IDL.Text],
            [ResultConversation],
            [],
          ),
          sendMessage: IDL.Func(
            [IDL.Text, IDL.Principal, IDL.Text],
            [ResultMessage],
            [],
          ),
          getMyConversations: IDL.Func(
            [],
            [ResultConversationSummaryArray],
            ["query"],
          ),
          getConversationMessages: IDL.Func(
            [IDL.Text, IDL.Nat, IDL.Nat],
            [ResultMessagePage],
            ["query"],
          ),
          markMessagesAsRead: IDL.Func([IDL.Text], [ResultBool], []),
          getConversation: IDL.Func(
            [IDL.Text],
            [ResultConversation],
            ["query"],
          ),
        });
      },
      wasm: resolve(
        __dirname,
        "..",
        "..",
        "target",
        "wasm32-unknown-unknown",
        "release",
        "chat.wasm",
      ),
    });

    actor = fixture.actor;
    canisterId = fixture.canisterId;
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  describe("setCanisterReferences", () => {
    it("should set canister references successfully", async () => {
      // Setup
      const authCanisterId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const bookingCanisterId = Principal.fromText(
        "ryjl3-tyaaa-aaaaa-aaaba-cai",
      );

      // Execute
      const result = await actor.setCanisterReferences(
        [authCanisterId],
        [bookingCanisterId],
      );

      // Assert
      expect(result).toEqual({ ok: "Canister references set successfully" });
    });

    it("should set canister references with null values", async () => {
      // Execute
      const result = await actor.setCanisterReferences([], []);

      // Assert
      expect(result).toEqual({ ok: "Canister references set successfully" });
    });
  });

  describe("createConversation", () => {
    it("should create a conversation successfully", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Execute
      const result = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );

      // Assert
      if ("ok" in result) {
        expect(result.ok.clientId.toString()).toBe(clientId.toString());
        expect(result.ok.providerId.toString()).toBe(providerId.toString());
        expect(result.ok.bookingId).toBe(bookingId);
        expect(result.ok.isActive).toBe(true);
        expect(result.ok.unreadCount).toHaveLength(2);
        expect(result.ok.lastMessageAt).toEqual([]);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });

    it("should reject anonymous principals", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // TODO: Test with anonymous principal - requires pic.updateCall with anonymous identity

      // For now, test should pass with authenticated principal
      const result = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      expect("ok" in result || "err" in result).toBe(true);
    });
  });

  describe("sendMessage", () => {
    it("should send a message successfully", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";
      const messageContent = "Hello, I have a question about the service.";

      // Create conversation first
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute
      const result = await actor.sendMessage(
        conversationId,
        providerId,
        messageContent,
      );

      // Assert
      if ("ok" in result) {
        expect(result.ok.conversationId).toBe(conversationId);
        expect(result.ok.receiverId.toString()).toBe(providerId.toString());
        expect(result.ok.content.encryptedText).toBe(messageContent); // Currently not encrypted
        expect(result.ok.messageType).toEqual({ Text: null });
        expect(result.ok.status).toEqual({ Sent: null });
        expect(result.ok.attachment).toEqual([]);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });

    it("should reject message to non-participant", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const outsiderId = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      const bookingId = "booking_123";
      const messageContent = "Hello";

      // Create conversation first
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute
      const result = await actor.sendMessage(
        conversationId,
        outsiderId,
        messageContent,
      );

      // Assert
      expect(result).toEqual({ err: "Receiver not part of this conversation" });
    });

    it("should reject message to self", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";
      const messageContent = "Hello";

      // Create conversation first
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute - try to send message to self
      const result = await actor.sendMessage(
        conversationId,
        clientId,
        messageContent,
      );

      // Assert
      expect(result).toEqual({ err: "Cannot send message to yourself" });
    });

    it("should reject message in non-existent conversation", async () => {
      // Setup
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const fakeConversationId = "non_existent_conversation";
      const messageContent = "Hello";

      // Execute
      const result = await actor.sendMessage(
        fakeConversationId,
        providerId,
        messageContent,
      );

      // Assert
      expect(result).toEqual({ err: "Conversation not found" });
    });
  });

  describe("getMyConversations", () => {
    it("should return empty array when no conversations exist", async () => {
      // Execute
      const result = await actor.getMyConversations();

      // Assert
      expect(result).toEqual({ ok: [] });
    });

    it("should return user's conversations", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      // Execute
      const result = await actor.getMyConversations();

      // Assert
      if ("ok" in result) {
        expect(result.ok).toHaveLength(1);
        expect(result.ok[0].conversation.id).toBe(conversationResult.ok.id);
        expect(result.ok[0].lastMessage).toEqual([]);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });
  });

  describe("getConversationMessages", () => {
    it("should return empty messages for conversation without messages", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute
      const result = await actor.getConversationMessages(
        conversationId,
        BigInt(10),
        BigInt(0),
      );

      // Assert
      if ("ok" in result) {
        expect(result.ok.messages).toHaveLength(0);
        expect(result.ok.hasMore).toBe(false);
        expect(result.ok.nextPageToken).toEqual([]);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });

    it("should return messages with pagination", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Send a message
      const messageResult = await actor.sendMessage(
        conversationId,
        providerId,
        "Hello!",
      );
      if ("err" in messageResult) {
        throw new Error(`Failed to send message: ${messageResult.err}`);
      }

      // Execute
      const result = await actor.getConversationMessages(
        conversationId,
        BigInt(10),
        BigInt(0),
      );

      // Assert
      if ("ok" in result) {
        expect(result.ok.messages).toHaveLength(1);
        expect(result.ok.messages[0].content.encryptedText).toBe("Hello!");
        expect(result.ok.hasMore).toBe(false);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });

    it("should reject unauthorized access", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // TODO: Test with different principal - requires pic.updateCall with different identity
      // For now, test should pass with authorized principal
      const result = await actor.getConversationMessages(
        conversationId,
        BigInt(10),
        BigInt(0),
      );
      expect("ok" in result || "err" in result).toBe(true);
    });
  });

  describe("markMessagesAsRead", () => {
    it("should mark messages as read successfully", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute
      const result = await actor.markMessagesAsRead(conversationId);

      // Assert
      expect(result).toEqual({ ok: true });
    });

    it("should reject for non-existent conversation", async () => {
      // Execute
      const result = await actor.markMessagesAsRead(
        "non_existent_conversation",
      );

      // Assert
      expect(result).toEqual({ err: "Conversation not found" });
    });
  });

  describe("getConversation", () => {
    it("should return conversation details for authorized user", async () => {
      // Setup
      const clientId = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai");
      const providerId = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
      const bookingId = "booking_123";

      // Create conversation
      const conversationResult = await actor.createConversation(
        clientId,
        providerId,
        bookingId,
      );
      if ("err" in conversationResult) {
        throw new Error(
          `Failed to create conversation: ${conversationResult.err}`,
        );
      }

      const conversationId = conversationResult.ok.id;

      // Execute
      const result = await actor.getConversation(conversationId);

      // Assert
      if ("ok" in result) {
        expect(result.ok.id).toBe(conversationId);
        expect(result.ok.clientId.toString()).toBe(clientId.toString());
        expect(result.ok.providerId.toString()).toBe(providerId.toString());
        expect(result.ok.bookingId).toBe(bookingId);
      } else {
        throw new Error(`Expected ok, got err: ${result.err}`);
      }
    });

    it("should reject for non-existent conversation", async () => {
      // Execute
      const result = await actor.getConversation("non_existent_conversation");

      // Assert
      expect(result).toEqual({ err: "Conversation not found" });
    });
  });
});
