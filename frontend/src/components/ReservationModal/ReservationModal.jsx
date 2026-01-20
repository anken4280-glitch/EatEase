import React, { useState, useEffect } from 'react';
import './ReservationModal.css';

const ReservationModal = ({ restaurant, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        party_size: 2,
        reservation_date: '',
        reservation_time: '',
        special_requests: ''
    });
    
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);

    // Set default date to tomorrow
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const formattedDate = tomorrow.toISOString().split('T')[0];
        
        setFormData(prev => ({
            ...prev,
            reservation_date: formattedDate
        }));
        
        // Generate time slots (5 PM to 10 PM, 30 min intervals)
        generateTimeSlots();
    }, []);

    // Check availability when date or party size changes
    useEffect(() => {
        if (formData.reservation_date && formData.party_size > 0) {
            checkAvailability();
        }
    }, [formData.reservation_date, formData.party_size]);

    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 17; // 5 PM
        const endHour = 22;   // 10 PM
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of ['00', '30']) {
                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
                slots.push({ time, displayTime });
            }
        }
        setTimeSlots(slots);
    };

    const checkAvailability = async () => {
        if (!restaurant?.id || !formData.reservation_date) return;
        
        setCheckingAvailability(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `http://localhost/EatEase/backend/public/api/restaurants/${restaurant.id}/availability?date=${formData.reservation_date}&party_size=${formData.party_size}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAvailableSlots(data.time_slots || []);
                
                // Auto-select first available slot
                const firstAvailable = data.time_slots?.find(slot => slot.available);
                if (firstAvailable && !formData.reservation_time) {
                    setFormData(prev => ({ ...prev, reservation_time: firstAvailable.time }));
                }
            }
        } catch (error) {
            console.error('Error checking availability:', error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.reservation_time) {
            alert('Please select a time slot');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                'http://localhost/EatEase/backend/public/api/reservations',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        ...formData,
                        restaurant_id: restaurant.id
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                alert(`🎉 Reservation confirmed! Confirmation: ${data.confirmation_code}`);
                if (onSuccess) onSuccess(data.reservation);
                onClose();
            } else {
                alert(data.message || 'Failed to create reservation');
            }
        } catch (error) {
            console.error('Error creating reservation:', error);
            alert('Error creating reservation');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="reservation-modal-overlay">
            <div className="reservation-modal">
                <div className="modal-header">
                    <h2>Reserve at {restaurant?.name}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {restaurant && (
                    <div className="restaurant-info">
                        <p>📍 {restaurant.address}</p>
                        <p>📞 {restaurant.phone || 'N/A'}</p>
                        <p>👥 Max Capacity: {restaurant.max_capacity} people</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="reservation-form">
                    <div className="form-group">
                        <label>Party Size</label>
                        <select 
                            name="party_size" 
                            value={formData.party_size}
                            onChange={handleChange}
                            className="party-size-select"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <option key={num} value={num}>
                                    {num} {num === 1 ? 'person' : 'people'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="reservation_date"
                            value={formData.reservation_date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Time Slot {checkingAvailability && '(Checking...)'}</label>
                        <div className="time-slots">
                            {timeSlots.map(slot => {
                                const slotData = availableSlots.find(s => s.time === slot.time);
                                const isAvailable = slotData?.available ?? true;
                                const isSelected = formData.reservation_time === slot.time;
                                
                                return (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        className={`time-slot ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (isAvailable) {
                                                setFormData(prev => ({ ...prev, reservation_time: slot.time }));
                                            }
                                        }}
                                        disabled={!isAvailable}
                                    >
                                        {slot.displayTime}
                                        {!isAvailable && <span className="slot-status">Full</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Special Requests (Optional)</label>
                        <textarea
                            name="special_requests"
                            value={formData.special_requests}
                            onChange={handleChange}
                            placeholder="Any dietary restrictions, allergies, or special occasions?"
                            rows="3"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="reserve-btn" disabled={loading || !formData.reservation_time}>
                            {loading ? 'Creating...' : 'Confirm Reservation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;