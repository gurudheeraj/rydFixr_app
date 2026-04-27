// backend/websocket/socketHandler.js
const fixpertSockets = new Map(); // fixpertId -> socket
const customerSockets = new Map(); // customerId -> socket
const activeRequests = new Map(); // customerId -> { assignedAt }
const rideOTPMap = new Map(); // fixpertId -> otp

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Register Fixpert
    socket.on('register-fixpert', (fixpertId) => {
      fixpertSockets.set(fixpertId, socket);
      console.log(`Fixpert registered: ${fixpertId}`);
    });

    // Register Customer
    socket.on('register-customer', (customerEmail) => {
      const normalizedEmail = customerEmail.toLowerCase().trim();

      customerSockets.set(normalizedEmail, socket);
      console.log("Customer registered:", normalizedEmail);

      // 🔥 NEW CODE START
      // 🔥 ONLY send if request is STILL VALID (not stale)
      /*
      const existing = activeRequests.get(normalizedEmail);

      if (existing && existing.assignedAt && (Date.now() - existing.assignedAt < 30000)) {
        console.log("🔁 Sending valid active request to customer");

        socket.emit('fixpert-assigned', {
          fixpert: existing.fixpertInfo,
          assignedAt: existing.assignedAt,
          customerLocation: existing.fixpertInfo.customerLocation,
          distance: existing.fixpertInfo.distance
        });
      }
        */
      // 🔥 NEW CODE END
    });

    // Handle location updates from fixpert
    socket.on('fixpert-location', ({ fixpertId, location }) => {
      console.log(`Fixpert ${fixpertId} location:`, location);
      for (let [customerEmail, request] of activeRequests) {
        const customerSocket = customerSockets.get(customerEmail);

        if (customerSocket) {
          customerSocket.emit('fixpert-location-update', {
            fixpertId,
            location
          });
        }
      }
    });

    // 🔥 STORE OTP FROM CUSTOMER
    socket.on("send-otp", ({ otp, fixpertId, customerEmail }) => {
      console.log("📩 OTP received:", otp, "for", fixpertId);

      rideOTPMap.set(fixpertId, {
        otp,
        customerEmail: (customerEmail || "").toLowerCase().trim()
      });
    });

    // 🔥 VERIFY OTP FROM FIXPERT
    /*socket.on("verify-otp", ({ otp, fixpertId }) => {

      const storedOTP = rideOTPMap.get(fixpertId);

      console.log("🔍 Comparing OTP:", otp, storedOTP);

      const fixpertSocket = fixpertSockets.get(fixpertId); // 🔥 ADD THIS

      if (!fixpertSocket) {
        console.log("❌ Fixpert socket not found");
        return;
      }

      if (storedOTP && otp == storedOTP) {

        rideOTPMap.delete(fixpertId);

        console.log("🗑️ OTP deleted after success");

        fixpertSocket.emit("otp-result", { success: true }); // 🔥 FIXED

      } else {
        fixpertSocket.emit("otp-result", { success: false }); // 🔥 FIXED
      }

    });
    */
   /*
    socket.on("verify-otp", ({ otp, fixpertId, customerEmail }) => {

      const storedOTP = rideOTPMap.get(fixpertId);

      console.log("🔍 Comparing OTP:", otp, storedOTP);

      const fixpertSocket = fixpertSockets.get(fixpertId);
      const cleanEmail = (customerEmail || "").toLowerCase().trim();
      console.log("Looking for:", cleanEmail);
      const customerSocket = customerSockets.get(cleanEmail);

      console.log("👤 customerEmail received:", customerEmail);
      console.log("👤 normalized:", cleanEmail);
      console.log("👤 customerSocket:", customerSocket);

      if (!fixpertSocket) {
        console.log("❌ Fixpert socket not found");
        return;
      }

      if (storedOTP && otp == storedOTP) {

        rideOTPMap.delete(fixpertId);

        console.log("🗑️ OTP deleted after success");

        fixpertSocket.emit("otp-result", { success: true });

        // 🔥 DEBUG HERE
        console.log("🚀 BROADCASTING service-started");

        // 🔥 SEND TO ALL CLIENTS
        io.emit("service-started", {
          customerEmail: cleanEmail
        });

      } else {
        fixpertSocket.emit("otp-result", { success: false });
      }

    });
    */
    socket.on("verify-otp", ({ otp, fixpertId }) => {
      const data = rideOTPMap.get(fixpertId);

      if (!data) {
        console.log("❌ No OTP data found");
        return;
      }

      const storedOTP = data.otp;
      const cleanEmail = data.customerEmail;

      console.log("🔍 Comparing OTP:", otp, storedOTP);
      console.log("📧 Using stored email:", cleanEmail);

      const fixpertSocket = fixpertSockets.get(fixpertId);

      if (!fixpertSocket) {
        console.log("❌ Fixpert socket not found");
        return;
      }

      if (storedOTP && otp == storedOTP) {

        rideOTPMap.delete(fixpertId);

        console.log("🗑️ OTP deleted after success");

        fixpertSocket.emit("otp-result", { success: true });

        console.log("🚀 BROADCASTING service-started");

        io.emit("service-started", {
          customerEmail: cleanEmail
        });

      } else {
        fixpertSocket.emit("otp-result", { success: false });
      }

    });

    // When fixpert accepts request
    socket.on('request-accepted', ({ customerEmail, fixpertInfo },callback) => {

      const normalizedEmail = customerEmail.toLowerCase().trim();

      console.log("📡 Trying to send to:", normalizedEmail);
      console.log("🧠 Available sockets:", [...customerSockets.keys()]);

      const assignedAt = Date.now();
      activeRequests.set(normalizedEmail, { 
        assignedAt, 
        fixpertInfo:{
        ...fixpertInfo,
        customerEmail: customerEmail
        } 
      });

      const customerSocket = customerSockets.get(normalizedEmail);

      console.log("🧠 Socket found:", customerSocket ? "YES" : "NO");

      if (customerSocket && customerSocket.connected) {
        console.log("📤 SENDING TO CUSTOMER:", fixpertInfo.customerLocation);
        customerSocket.emit('fixpert-assigned', {
          fixpert: {...fixpertInfo,
            customerEmail: customerEmail
          },
          assignedAt,
          customerLocation: fixpertInfo.customerLocation,
          distance: fixpertInfo.distance   
        });
      } else {
        console.log("❌ Customer socket NOT FOUND or DISCONNECTED");

        // 🔥 RETRY AFTER SHORT DELAY
        setTimeout(() => {
          const retrySocket = customerSockets.get(normalizedEmail);

          if (retrySocket && retrySocket.connected) {
            console.log("🔁 Retry success!");
            retrySocket.emit('fixpert-assigned', {
              fixpert: {
                ...fixpertInfo,
                customerEmail: customerEmail // 🔥 ADD THIS
              },
              assignedAt,
              customerLocation: fixpertInfo.customerLocation,
              distance: fixpertInfo.distance
            });
          } else {
            console.log("❌ Retry failed");
          }
        }, 1000);
      }
      // 🔥🔥🔥 ADD THIS BLOCK (ONLY NEW CODE)
      console.log("📤 SENDING TO FIXPERT ALSO");

      socket.emit('fixpert-assigned', {
        fixpert: {
          ...fixpertInfo,
          customerEmail: customerEmail // 🔥 ADD THIS
        },
        assignedAt
      });
      if (callback) callback("received");
    });

    socket.on("cancel-fixpert", ({ customerEmail }) => {
      const normalizedEmail = customerEmail.toLowerCase().trim();
      const request = activeRequests.get(normalizedEmail);
      if (!request) return;

      const elapsed = (Date.now() - request.assignedAt) / 1000;

      const customerSocket = customerSockets.get(normalizedEmail);

      if (elapsed > 30) {
        if (customerSocket) {
          customerSocket.emit("cancel-denied", {
            message: "❌ Cannot cancel after 30 seconds"
          });
        }
        return;
      }

      activeRequests.delete(normalizedEmail);

      if (customerSocket) {
        customerSocket.emit("cancel-success");
        customerSocket.emit("ride-cancelled");
      }

      console.log("✅ Cancel allowed");
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      // Remove from maps
      for (let [id, s] of fixpertSockets) {
        if (s.id === socket.id) fixpertSockets.delete(id);
      }
      for (let [id, s] of customerSockets) {
        if (s.id === socket.id) customerSockets.delete(id);
      }
    });
  });
}

module.exports = {
  setupSocket,
  fixpertSockets,
  customerSockets
};
