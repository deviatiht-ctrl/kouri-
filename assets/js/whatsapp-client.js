/**
 * ======================================================================
 * KOURI — Frontend WhatsApp Notification Helper (whatsapp-client.js)
 * Calls the secure backend proxy to trigger automated WhatsApp messages.
 * Never exposes the CVISUAL_WA_API_KEY in the browser!
 * ======================================================================
 */

class WhatsAppClient {
  constructor() {
    this.endpoint = '/api/whatsapp/notify-event';
  }

  async sendEvent(eventType, payload) {
    if (!payload || !payload.phone) {
      console.debug('[KOURI WA] No recipient phone for event:', eventType);
      return false;
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          data: payload
        })
      });

      if (res.ok) {
        const json = await res.json();
        console.log(`[KOURI WA] Sent ${eventType} WhatsApp notice to ${payload.phone}`);
        return json;
      }
    } catch (err) {
      console.warn(`[KOURI WA] Could not reach backend WhatsApp proxy:`, err.message);
    }
    return false;
  }

  // 1. Welcome upon registration
  async notifyWelcome(user) {
    return this.sendEvent('welcome', {
      phone: user.phone,
      name: user.full_name || 'Pasaje'
    });
  }

  // 2. Ride Requested / Booked (With PIN code)
  async notifyRideRequested(ride) {
    return this.sendEvent('ride_requested', {
      phone: ride.rider_phone,
      name: ride.rider_name,
      rideId: ride.id,
      tripCode: ride.trip_code,
      address: ride.pickup_address
    });
  }

  // 3. Driver Assigned
  async notifyDriverAssigned(ride) {
    return this.sendEvent('driver_assigned', {
      phone: ride.rider_phone,
      driverName: ride.driver_name,
      plate: ride.vehicle_plate,
      tripCode: ride.trip_code
    });
  }

  // 4. Driver Arrived on pickup spot
  async notifyDriverArrived(ride) {
    return this.sendEvent('driver_arrived', {
      phone: ride.rider_phone,
      driverName: ride.driver_name
    });
  }

  // 5. Trip Completed & Receipt
  async notifyRideCompleted(ride) {
    return this.sendEvent('ride_completed', {
      phone: ride.rider_phone,
      fare: ride.fare,
      distance: ride.distance_km
    });
  }
}

window.whatsappClient = new WhatsAppClient();
