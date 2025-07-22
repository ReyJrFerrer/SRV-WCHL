import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./src/App";
import "./src/index.css";

// Layout Components
import ClientLayout from "./src/components/layout/ClientLayout";
import ProviderLayout from "./src/components/layout/ProviderLayout";
import {
  ClientRedirect,
  ProviderRedirect,
} from "./src/components/layout/Redirects";

// Auth Pages
import CreateProfile from "./src/pages/create-profile";

// Client Pages
import ClientHome from "./src/pages/client/home";
import ClientChat from "./src/pages/client/chat";
import SearchResults from "./src/pages/client/search-results";

// Client Service Pages
import ClientServiceViewAll from "./src/pages/client/service/view-all";
import ClientServiceDetails from "./src/pages/client/service/[id]";
import ClientServiceReviews from "./src/pages/client/service/reviews/[id]";

// Client Booking Pages
import ClientBookingIndex from "./src/pages/client/booking/index";
import ClientBookingDetails from "./src/pages/client/booking/[id]";
import ClientBookingConfirmation from "./src/pages/client/booking/confirmation";
import ClientBookService from "./src/pages/client/book/[id]";

// Client Category & Review Pages
import ClientCategory from "./src/pages/client/categories/[slug]";
import ClientReview from "./src/pages/client/review/[id]";

// Provider Pages
import ProviderHome from "./src/pages/provider/home";
import ProviderBookings from "./src/pages/provider/bookings";

// Provider Service Management
import ProviderServices from "./src/pages/provider/services";
import ProviderAddService from "./src/pages/provider/services/add";
import ProviderEditService from "./src/pages/provider/services/edit/[id]";

// Provider Service Details
import ProviderServiceDetails from "./src/pages/provider/service-details/[id]";
import ProviderServiceReviews from "./src/pages/provider/service-details/reviews/[id]";

// Provider Booking Management
import ProviderBookingDetails from "./src/pages/provider/booking/[id]";
import ProviderActiveService from "./src/pages/provider/active-service/[bookingId]";
import ProviderCompleteService from "./src/pages/provider/complete-service/[bookingId]";
import ProviderReceipt from "./src/pages/provider/receipt/[bookingId]";

// Provider Review
import ProviderReview from "./src/pages/provider/review/[id]";

// Context
import { AuthProvider } from "./src/context/AuthContext";
import ConversationPage from "./src/pages/client/chat/[providerId]";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          <Route path="/create-profile" element={<CreateProfile />} />

          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientRedirect />} />
            <Route path="home" element={<ClientHome />} />
            <Route path="chat" element={<ClientChat />} />
            <Route path="chat/:providerId" element={<ConversationPage />} />
            <Route path="search-results" element={<SearchResults />} />

            {/* Service Routes */}
            <Route path="service/view-all" element={<ClientServiceViewAll />} />
            <Route path="service/:id" element={<ClientServiceDetails />} />
            <Route
              path="service/reviews/:id"
              element={<ClientServiceReviews />}
            />

            {/* Booking Routes */}
            <Route path="booking" element={<ClientBookingIndex />} />
            <Route path="booking/:id" element={<ClientBookingDetails />} />
            <Route
              path="booking/confirmation"
              element={<ClientBookingConfirmation />}
            />
            <Route path="book/:id" element={<ClientBookService />} />

            {/* Category & Review Routes */}
            <Route path="categories/:slug" element={<ClientCategory />} />
            <Route path="review/:id" element={<ClientReview />} />
          </Route>

          {/* Provider Routes with Nested Layout */}
          <Route path="/provider" element={<ProviderLayout />}>
            <Route index element={<ProviderRedirect />} />
            <Route path="home" element={<ProviderHome />} />
            <Route path="bookings" element={<ProviderBookings />} />

            {/* Service Management Routes */}
            <Route path="services" element={<ProviderServices />} />
            <Route path="services/add" element={<ProviderAddService />} />
            <Route path="services/edit/:id" element={<ProviderEditService />} />

            {/* Service Details Routes */}
            <Route
              path="service-details/:id"
              element={<ProviderServiceDetails />}
            />
            <Route
              path="service-details/reviews/:id"
              element={<ProviderServiceReviews />}
            />

            {/* Booking Management Routes */}
            <Route path="booking/:id" element={<ProviderBookingDetails />} />
            <Route
              path="active-service/:bookingId"
              element={<ProviderActiveService />}
            />
            <Route
              path="complete-service/:bookingId"
              element={<ProviderCompleteService />}
            />
            <Route path="receipt/:bookingId" element={<ProviderReceipt />} />

            {/* Review Routes */}
            <Route path="review/:id" element={<ProviderReview />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
