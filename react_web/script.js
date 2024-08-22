document.addEventListener('DOMContentLoaded', async () => {
    const apiUrl = 'http://127.0.0.1:5000/app'; // Replace with your API URL



    const patientInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(response)
    
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
    
            const result = await response.json();
            if (result.message === 'Success') {
                const patient = result.data;
                document.getElementById('name').textContent = patient.name;
                document.getElementById('age').textContent = patient.age;
                document.getElementById('gender').textContent = patient.gender;
                document.getElementById('medical_history').textContent = patient.medical_history;
                document.getElementById('phone').textContent = patient.phone;
            } else {
                alert('Error: ' + result.message);
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            alert('Failed to load patient profile.');
        }
    
    }


    // Fetch All Appointments
// document.getElementById('fetch-appointments').addEventListener('click', async () => {
    const allAppointments = async () => {
    
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${apiUrl}/all_appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.message === "Success" && data.appointment) {
                const appointmentsList = document.getElementById('appointments-list');
                appointmentsList.innerHTML = ''; // Clear existing content

                data.appointment.forEach(app => {
                    console.log(app);
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div>
                            <strong>Appointment ID:</strong> ${app._id}
                        </div>
                        <div>
                            <strong>Doctor Name:</strong> ${app.doctorId.name}
                        </div>
                        <div>
                            <strong>Specialty:</strong> ${app.case.required_specialty}
                        </div>
                        <div>
                            <strong>Date:</strong> ${new Date(app.slots.date).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>Time:</strong> ${app.slots.startTime} - ${app.slots.endTime}
                        </div>
                        <div>
                            <strong>Current Symptoms:</strong> ${app.case.current_symptoms}
                        </div>
                        
                        <div>
                            <strong>Status:</strong> ${app.status}
                        </div>
                        ${app.status === 'Pending' ? `<button class="cancel-button" data-id="${app._id}">Cancel Appointment</button>` : ''}
                        <hr>
                    `;
                    appointmentsList.appendChild(li);
                });

                // Add event listeners to cancel buttons
                document.querySelectorAll('.cancel-button').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const appointmentId = e.target.dataset.id;
                        try {
                            const response = await fetch(`${apiUrl}/cancel_appointment`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ appointment_id: appointmentId })
                            });
                            const data = await response.json();
                            alert(data.message);
                            // Re-fetch appointments to update the list
                            // document.getElementById('fetch-appointments').click();
                            await allAppointments();
                        } catch (err) {
                            console.error('Error:', err);
                            alert('Error canceling appointment');
                        }
                    });
                });

            } else {
                alert('No appointments found or error in response');
            }
            console.log('Fetched appointments:', data);
        } catch (err) {
            console.error('Error:', err);
            alert('Error fetching appointments');
        }
    }
// });


    const checkLoginState = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            document.getElementById('not-logged-in').style.display = 'none';
            document.getElementById('logged-in').style.display = 'block';
            await patientInfo();
            await allAppointments();
        } else {
            document.getElementById('not-logged-in').style.display = 'block';
            document.getElementById('logged-in').style.display = 'none';
        }
    }

    // Call checkLoginState on page load
    await checkLoginState();






    // Sign Up
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const age = document.getElementById('signup-age').value;
        const gender = document.getElementById('signup-gender').value;
        const medicalHistory = document.getElementById('signup-medical-history').value;
        const phone = document.getElementById('signup-phone').value;
        const pass = document.getElementById('signup-pass').value;

        try {
            const response = await fetch(`${apiUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ age, name, gender, medical_history: medicalHistory, phone, pass })
            });
            const data = await response.json();
            alert(data.message);
        } catch (err) {
            console.error('Error:', err);
            alert('Error signing up');
        }
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const patientId = document.getElementById('login-patient-id').value;
        const pass = document.getElementById('login-pass').value;

        try {
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientId, pass })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Login successful');
                checkLoginState();
            } else {
                alert('Login failed');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error logging in');
        }
    });

    // Fetch Slot Data
    let slotData = [];
    async function fetchSlotData() {
        try {
            const response = await fetch(`${apiUrl}/slots`);
            if (response.ok) {
                slotData = await response.json();
                console.log('Fetched slot data:', slotData);
            } else {
                console.error('Failed to fetch slot data');
            }
        } catch (error) {
            console.error('Error fetching slot data:', error);
        }
    }

    // Setup Date Change Listener
    function setupDateChangeListener() {
        const dateInput = document.getElementById('appointment-date');
        if (dateInput) {
            dateInput.addEventListener('change', updateTimeSlots);
        } else {
            console.error('Date input not found');
        }
    }

    // Update Time Slots
    function updateTimeSlots() {
        const selectedDate = document.getElementById('appointment-date').value;
        const timeContainer = document.getElementById('appointment-time');



        timeContainer.innerHTML = '<p>Select a time slot:</p>'; // Clear previous buttons

        if (!selectedDate) return;

        const dateSlots = slotData.find(slot => slot.date === selectedDate);
        if (dateSlots) {
            dateSlots.slots.forEach(slot => {
                const button = document.createElement('button');
                button.type = 'button';
                button.classList.add('time-slot-button');
                button.dataset.time = `${slot.startTime}-${slot.endTime}`;
                button.textContent = `${slot.startTime} to ${slot.endTime}`;
                button.addEventListener('click', () => selectTimeSlot(button));
                timeContainer.appendChild(button);
            });
        }
    }

    // Select Time Slot
    function selectTimeSlot(button) {
        const buttons = document.querySelectorAll('.time-slot-button');
        buttons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        const hiddenInput = document.getElementById('appointment-time-selected');
        if (hiddenInput) {
            hiddenInput.value = button.dataset.time;
        } else {
            console.error('Hidden input element not found');
        }
    }

    const featureColumns = [
        'current_symptoms_Allergic Reactions', 'current_symptoms_Anxiety', 'current_symptoms_Arthritis',
        'current_symptoms_Blood Disorders', 'current_symptoms_Breathing Difficulty', 'current_symptoms_Chest Pain',
        'current_symptoms_Cold', 'current_symptoms_Cough', 'current_symptoms_Diarrhea', 'current_symptoms_Fatigue',
        'current_symptoms_Fever', 'current_symptoms_Headache', 'current_symptoms_High Blood Sugar',
        'current_symptoms_Infections', 'current_symptoms_Joint Pain', 'current_symptoms_Kidney Issues',
        'current_symptoms_Lump or Swelling', 'current_symptoms_Skin Rash', 'current_symptoms_Sore Throat',
        'current_symptoms_Stomach Pain', 'current_symptoms_Unknown Disease', 'current_symptoms_Urinary Issues',
        'current_symptoms_Vision Problems'
    ];
    
    const symptomInput = document.getElementById('appointment-symptoms');
    const suggestionsBox = document.getElementById('symptoms-suggestions');
    
    // Function to show autocomplete suggestions
    const showSuggestions = (query) => {
        suggestionsBox.innerHTML = '';
        if (query) {
            const regex = new RegExp(query, 'i');
            const suggestions = featureColumns.filter(column => column.includes(query));
            suggestions.forEach(symptom => {
                const item = document.createElement('div');
                item.textContent = symptom.replace('current_symptoms_', '').replace('_', ' ');
                item.classList.add('suggestion-item');
                item.addEventListener('click', () => {
                    symptomInput.value = symptom.replace('current_symptoms_', '').replace('_', ' ');
                    suggestionsBox.innerHTML = '';
                });
                suggestionsBox.appendChild(item);
            });
        }
    };

    // Event listener for input changes
    symptomInput.addEventListener('input', () => {
        const query = symptomInput.value.trim().replace(/\s+/g, '_');
        showSuggestions(query);
    });

    // Hide suggestions box when clicking outside
    document.addEventListener('click', (event) => {
        if (!symptomInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            suggestionsBox.innerHTML = '';
        }
    });
    

    // Handle Appointment Form Submission
    document.getElementById('appointment-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const date = document.getElementById('appointment-date').value;
        const timeRange = document.getElementById('appointment-time-selected').value;
        const symptoms = document.getElementById('appointment-symptoms').value;

        if (!date || !timeRange || !symptoms) {
            alert('Please fill all the required fields');
            return;
        }

        const slot = {
            requestedDate : date,
            timeRange : timeRange
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    slot: slot,
                    current_symptoms: symptoms
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Appointment booked successfully');
                await allAppointments();
            } else {
                alert(`Error: ${data.message}`);
            }

            console.log(date);
            console.log(timeRange)
            console.log(symptoms)
        } catch (error) {
            console.error('Error booking appointment:', error);
            alert('Error booking appointment');
        }
    });

    // Cancel Appointment
    // document.getElementById('cancel-appointment-form').addEventListener('submit', async (e) => {
    //     e.preventDefault();
    //     const appointmentId = document.getElementById('cancel-appointment-id').value;
    //     const token = localStorage.getItem('token');

    //     try {
    //         const response = await fetch(`${apiUrl}/cancel_appointment`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             body: JSON.stringify({ appointment_id: appointmentId })
    //         });
    //         const data = await response.json();
    //         alert(data.message);
    //     } catch (err) {
    //         console.error('Error:', err);
    //         alert('Error canceling appointment');
    //     }
    // });

    


    // Fetch Available Slots
    // document.getElementById('fetch-slots').addEventListener('click', async () => {
    //     try {
    //         const response = await fetch(`${apiUrl}/slots`);
    //         const data = await response.json();
    //         const slotsList = document.getElementById('slots-list');
    //         slotsList.innerHTML = '';
    //         data.slots.forEach(slot => {
    //             const li = document.createElement('li');
    //             li.textContent = `Date: ${slot.date}, Slots: ${slot.slots.map(s => `${s.startTime} - ${s.endTime}`).join(', ')}`;
    //             slotsList.appendChild(li);
    //         });
    //     } catch (err) {
    //         console.error('Error:', err);
    //         alert('Error fetching slots');
    //     }
    // });

    // Initial fetch for slots


    document.getElementById('logoutBtn').addEventListener('click', async () => {
        localStorage.removeItem('token');
        await checkLoginState();
    });

    await fetchSlotData();
    setupDateChangeListener();
});


