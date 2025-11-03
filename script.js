// ==================== UTILITY FUNCTIONS ====================

// Generate unique user ID
function generateUserId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `USER-${timestamp}-${randomStr}`.toUpperCase();
}

// Generate random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show notification
function showNotification(message, type = 'success') {
    alert(message); // Simple alert for now - can be replaced with custom notification
}

// ==================== LOCAL STORAGE MANAGEMENT ====================

// Initialize default data structure
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('serviceRequests')) {
        localStorage.setItem('serviceRequests', JSON.stringify([]));
    }
    if (!localStorage.getItem('appointments')) {
        localStorage.setItem('appointments', JSON.stringify([]));
    }
    if (!localStorage.getItem('pointsHistory')) {
        localStorage.setItem('pointsHistory', JSON.stringify([]));
    }
    // Create default admin if not exists
    const users = JSON.parse(localStorage.getItem('users'));
    if (!users.find(u => u.email === 'admin@admin.com')) {
        users.push({
            userId: 'ADMIN-001',
            name: 'Admin',
            email: 'admin@admin.com',
            password: 'admin123',
            phone: '',
            userType: 'admin',
            verified: true,
            registeredDate: new Date().toISOString()
        });
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Get all users
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

// Save user
function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
}

// Update user
function updateUser(userId, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.userId === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }
    return false;
}

// Get current logged in user
function getCurrentUser() {
    const userId = sessionStorage.getItem('currentUser');
    if (!userId) return null;
    const users = getUsers();
    return users.find(u => u.userId === userId);
}

// ==================== LOGIN PAGE (index.html) ====================

if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    initializeStorage();
    
    const loginTypeButtons = document.querySelectorAll('.btn-type');
    const loginForm = document.getElementById('loginForm');
    let selectedLoginType = 'customer';
    
    // Login type selector
    loginTypeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            loginTypeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedLoginType = this.dataset.type;
        });
    });
    
    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showNotification('Invalid email or password', 'error');
            return;
        }
        
        if (selectedLoginType === 'admin' && user.userType !== 'admin') {
            showNotification('Access denied. Admin credentials required.', 'error');
            return;
        }
        
        if (selectedLoginType === 'customer' && user.userType === 'admin') {
            showNotification('Please use Admin login', 'error');
            return;
        }
        
        if (!user.verified) {
            showNotification('Please verify your email first', 'error');
            return;
        }
        
        // Generate and show OTP
        const otp = generateOTP();
        sessionStorage.setItem('loginOTP', otp);
        sessionStorage.setItem('pendingUser', user.userId);
        
        console.log('OTP Generated:', otp); // In production, send via email
        alert(`OTP sent to ${email}. For demo: ${otp}`);
        
        showOTPModal();
    });
    
    // OTP Modal handling
    function showOTPModal() {
        const modal = document.getElementById('otpModal');
        modal.classList.add('show');
        setupOTPInputs();
    }
    
    function setupOTPInputs() {
        const inputs = document.querySelectorAll('.otp-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (this.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }
    
    document.getElementById('verifyOtpBtn').addEventListener('click', function() {
        const inputs = document.querySelectorAll('.otp-input');
        const enteredOTP = Array.from(inputs).map(input => input.value).join('');
        const correctOTP = sessionStorage.getItem('loginOTP');
        
        if (enteredOTP === correctOTP) {
            const userId = sessionStorage.getItem('pendingUser');
            sessionStorage.setItem('currentUser', userId);
            sessionStorage.removeItem('loginOTP');
            sessionStorage.removeItem('pendingUser');
            
            const user = getUsers().find(u => u.userId === userId);
            
            if (user.userType === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'customer-dashboard.html';
            }
        } else {
            showNotification('Invalid OTP', 'error');
        }
    });
    
    document.getElementById('resendOtp').addEventListener('click', function(e) {
        e.preventDefault();
        const otp = generateOTP();
        sessionStorage.setItem('loginOTP', otp);
        console.log('New OTP:', otp);
        alert(`New OTP: ${otp}`);
    });
}

// ==================== REGISTRATION PAGE (register.html) ====================

if (window.location.pathname.includes('register.html')) {
    initializeStorage();
    
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            showNotification('Email already registered', 'error');
            return;
        }
        
        // Generate OTP
        const otp = generateOTP();
        sessionStorage.setItem('registrationOTP', otp);
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
            name: fullName,
            email: email,
            phone: phone,
            password: password
        }));
        
        console.log('Registration OTP:', otp);
        alert(`OTP sent to ${email}. For demo: ${otp}`);
        
        document.getElementById('emailDisplay').textContent = email;
        showOTPModal();
    });
    
    function showOTPModal() {
        const modal = document.getElementById('otpModal');
        modal.classList.add('show');
        setupOTPInputs();
    }
    
    function setupOTPInputs() {
        const inputs = document.querySelectorAll('.otp-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (this.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }
    
    document.getElementById('verifyOtpBtn').addEventListener('click', function() {
        const inputs = document.querySelectorAll('.otp-input');
        const enteredOTP = Array.from(inputs).map(input => input.value).join('');
        const correctOTP = sessionStorage.getItem('registrationOTP');
        
        if (enteredOTP === correctOTP) {
            const pendingReg = JSON.parse(sessionStorage.getItem('pendingRegistration'));
            
            const newUser = {
                userId: generateUserId(),
                name: pendingReg.name,
                email: pendingReg.email,
                phone: pendingReg.phone,
                password: pendingReg.password,
                userType: 'customer',
                verified: true,
                registeredDate: new Date().toISOString(),
                membership: null,
                points: 0,
                serviceHistory: []
            };
            
            saveUser(newUser);
            sessionStorage.removeItem('registrationOTP');
            sessionStorage.removeItem('pendingRegistration');
            
            showNotification('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showNotification('Invalid OTP', 'error');
        }
    });
    
    document.getElementById('resendOtp').addEventListener('click', function(e) {
        e.preventDefault();
        const otp = generateOTP();
        sessionStorage.setItem('registrationOTP', otp);
        console.log('New OTP:', otp);
        alert(`New OTP: ${otp}`);
    });
}

// ==================== CUSTOMER DASHBOARD (customer-dashboard.html) ====================

if (window.location.pathname.includes('customer-dashboard.html')) {
    initializeStorage();
    
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.userType === 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user info
    document.getElementById('customerName').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('userId').textContent = currentUser.userId;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('memberSince').textContent = formatDate(currentUser.registeredDate);
    
    // Update stats
    updateDashboardStats();
    
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            
            if (section === 'points') {
                loadPointsSection();
            } else if (section === 'services') {
                loadServiceHistory();
            } else if (section === 'membership') {
                loadMembershipSection();
            } else if (section === 'service-request') {
                loadServiceRequests();
            }
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Update dashboard stats
    function updateDashboardStats() {
        const user = getCurrentUser();
        document.getElementById('totalPoints').textContent = user.points || 0;
        document.getElementById('servicesCount').textContent = user.serviceHistory ? user.serviceHistory.length : 0;
        document.getElementById('membershipStatus').textContent = user.membership ? 'Active' : 'Inactive';
    }
    
    // Load membership section
    function loadMembershipSection() {
        const user = getCurrentUser();
        const membershipCard = document.getElementById('membershipCard');
        
        if (!user.membership) {
            membershipCard.innerHTML = '<p class="no-membership">You don\'t have an active membership yet.</p>';
        } else {
            membershipCard.innerHTML = `
                <h3 style="margin-bottom: 20px;">${user.membership.type.toUpperCase()} Membership</h3>
                <div class="membership-info">
                    <div class="membership-detail">
                        <div class="label">Start Date</div>
                        <div class="value">${formatDate(user.membership.startDate)}</div>
                    </div>
                    <div class="membership-detail">
                        <div class="label">Expiry Date</div>
                        <div class="value">${formatDate(user.membership.expiryDate)}</div>
                    </div>
                    <div class="membership-detail">
                        <div class="label">Status</div>
                        <div class="value">${new Date(user.membership.expiryDate) > new Date() ? 'Active' : 'Expired'}</div>
                    </div>
                    <div class="membership-detail">
                        <div class="label">Member ID</div>
                        <div class="value">${user.userId}</div>
                    </div>
                </div>
            `;
        }
    }
    
    // Load points section
    function loadPointsSection() {
        const user = getCurrentUser();
        const pointsContent = document.getElementById('pointsContent');
        
        if (!user.membership) {
            pointsContent.innerHTML = '<p class="no-data">Membership required to view points.</p>';
        } else {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 12);
            
            pointsContent.innerHTML = `
                <div class="points-grid">
                    <div class="points-card">
                        <h4>Total Points</h4>
                        <div class="points-value">${user.points || 0}</div>
                    </div>
                    <div class="points-card">
                        <h4>Points Value</h4>
                        <div class="points-value">₹${(user.points || 0) * 0.5}</div>
                        <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">1 point = ₹0.50</p>
                    </div>
                    <div class="points-card">
                        <h4>Points Expiry</h4>
                        <div class="points-expiry">${formatDate(expiryDate)}</div>
                    </div>
                </div>
            `;
        }
    }
    
    // Load service history
    function loadServiceHistory() {
        const user = getCurrentUser();
        const tbody = document.getElementById('serviceTableBody');
        
        if (!user.serviceHistory || user.serviceHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No service history available</td></tr>';
        } else {
            tbody.innerHTML = user.serviceHistory.map(service => `
                <tr>
                    <td>${formatDate(service.date)}</td>
                    <td>${service.serviceName}</td>
                    <td>${service.pointsEarned}</td>
                    <td><span class="status-badge status-${service.status}">${service.status}</span></td>
                </tr>
            `).join('');
        }
    }
    
    // Appointment form
    document.getElementById('appointmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const appointment = {
            id: Date.now(),
            userId: currentUser.userId,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            serviceType: document.getElementById('serviceType').value,
            notes: document.getElementById('appointmentNotes').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        showNotification('Appointment booked successfully!');
        this.reset();
    });
    
    // Service request form
    document.getElementById('serviceRequestForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const request = {
            id: Date.now(),
            userId: currentUser.userId,
            title: document.getElementById('requestTitle').value,
            category: document.getElementById('requestCategory').value,
            details: document.getElementById('requestDetails').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        const requests = JSON.parse(localStorage.getItem('serviceRequests')) || [];
        requests.push(request);
        localStorage.setItem('serviceRequests', JSON.stringify(requests));
        
        showNotification('Service request submitted successfully!');
        this.reset();
        loadServiceRequests();
    });
    
    // Load service requests
    function loadServiceRequests() {
        const requests = JSON.parse(localStorage.getItem('serviceRequests')) || [];
        const userRequests = requests.filter(r => r.userId === currentUser.userId);
        const tbody = document.getElementById('serviceRequestsBody');
        
        if (userRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-data">No service requests yet</td></tr>';
        } else {
            tbody.innerHTML = userRequests.map(request => `
                <tr>
                    <td>${formatDate(request.createdAt)}</td>
                    <td>${request.title}</td>
                    <td>${request.category}</td>
                    <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                </tr>
            `).join('');
        }
    }
    
    // Initial loads
    loadMembershipSection();
    loadServiceHistory();
}

// ==================== ADMIN DASHBOARD (admin-dashboard.html) ====================

if (window.location.pathname.includes('admin-dashboard.html')) {
    initializeStorage();
    
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.userType !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            
            if (section === 'members') {
                loadMembers();
            } else if (section === 'points-mgmt') {
                loadMemberSelects();
                loadPointsHistory();
            } else if (section === 'membership-mgmt') {
                loadMemberSelects();
            } else if (section === 'requests') {
                loadServiceRequestsAdmin();
            }
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Load all members
    function loadMembers() {
        const users = getUsers().filter(u => u.userType !== 'admin');
        const tbody = document.getElementById('membersTableBody');
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.userId}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge status-${user.membership ? 'active' : 'inactive'}">${user.membership ? user.membership.type : 'None'}</span></td>
                <td>${user.points || 0}</td>
                <td>
                    <button class="action-btn btn-view" onclick="viewMemberDetails('${user.userId}')">View</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Load member selects for dropdowns
    function loadMemberSelects() {
        const users = getUsers().filter(u => u.userType !== 'admin');
        const select1 = document.getElementById('memberSelect');
        const select2 = document.getElementById('memberSelectMembership');
        
        const options = users.map(u => `<option value="${u.userId}">${u.name} (${u.userId})</option>`).join('');
        
        select1.innerHTML = '<option value="">Choose a member</option>' + options;
        select2.innerHTML = '<option value="">Choose a member</option>' + options;
    }
    
    // Update points form
    document.getElementById('updatePointsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('memberSelect').value;
        const action = document.getElementById('pointsAction').value;
        const amount = parseInt(document.getElementById('pointsAmount').value);
        const reason = document.getElementById('pointsReason').value;
        
        const users = getUsers();
        const user = users.find(u => u.userId === userId);
        
        if (!user) {
            showNotification('User not found', 'error');
            return;
        }
        
        let newPoints = user.points || 0;
        
        if (action === 'add') {
            newPoints += amount;
        } else if (action === 'subtract') {
            newPoints = Math.max(0, newPoints - amount);
        } else if (action === 'set') {
            newPoints = amount;
        }
        
        updateUser(userId, { points: newPoints });
        
        // Add to service history
        if (!user.serviceHistory) user.serviceHistory = [];
        user.serviceHistory.push({
            date: new Date().toISOString(),
            serviceName: reason,
            pointsEarned: action === 'add' ? amount : -amount,
            status: 'completed'
        });
        updateUser(userId, { serviceHistory: user.serviceHistory });
        
        // Add to points history
        const pointsHistory = JSON.parse(localStorage.getItem('pointsHistory')) || [];
        pointsHistory.push({
            date: new Date().toISOString(),
            userId: userId,
            userName: user.name,
            action: action,
            amount: amount,
            reason: reason
        });
        localStorage.setItem('pointsHistory', JSON.stringify(pointsHistory));
        
        showNotification('Points updated successfully!');
        this.reset();
        loadPointsHistory();
    });
    
    // Load points history
    function loadPointsHistory() {
        const history = JSON.parse(localStorage.getItem('pointsHistory')) || [];
        const tbody = document.getElementById('pointsHistoryBody');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">No points updates yet</td></tr>';
        } else {
            tbody.innerHTML = history.slice(-10).reverse().map(h => `
                <tr>
                    <td>${formatDate(h.date)}</td>
                    <td>${h.userName}</td>
                    <td>${h.action}</td>
                    <td>${h.amount}</td>
                    <td>${h.reason}</td>
                </tr>
            `).join('');
        }
    }
    
    // Membership action change handler
    document.getElementById('membershipAction').addEventListener('change', function() {
        const action = this.value;
        const typeGroup = document.getElementById('membershipTypeGroup');
        const expiryGroup = document.getElementById('expiryDateGroup');
        
        if (action === 'grant') {
            typeGroup.style.display = 'block';
            expiryGroup.style.display = 'block';
        } else {
            typeGroup.style.display = 'none';
            expiryGroup.style.display = 'none';
        }
    });
    
    // Membership control form
    document.getElementById('membershipControlForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('memberSelectMembership').value;
        const action = document.getElementById('membershipAction').value;
        
        const users = getUsers();
        const user = users.find(u => u.userId === userId);
        
        if (!user) {
            showNotification('User not found', 'error');
            return;
        }
        
        if (action === 'grant') {
            const type = document.getElementById('membershipType').value;
            const expiryDate = document.getElementById('expiryDate').value;
            
            updateUser(userId, {
                membership: {
                    type: type,
                    startDate: new Date().toISOString(),
                    expiryDate: expiryDate
                }
            });
            
            showNotification(`${type} membership granted to ${user.name}`);
        } else if (action === 'revoke') {
            updateUser(userId, {
                membership: null,
                points: 0
            });
            
            showNotification(`Membership revoked for ${user.name}`);
        }
        
        this.reset();
        loadMembers();
    });
    
    // Load service requests for admin
    function loadServiceRequestsAdmin() {
        const requests = JSON.parse(localStorage.getItem('serviceRequests')) || [];
        const tbody = document.getElementById('requestsTableBody');
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No service requests available</td></tr>';
        } else {
            tbody.innerHTML = requests.map(request => `
                <tr>
                    <td>${formatDate(request.createdAt)}</td>
                    <td>${request.userId}</td>
                    <td>${request.title}</td>
                    <td>${request.category}</td>
                    <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                    <td>
                        <button class="action-btn btn-view" onclick="viewRequest(${request.id})">View</button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // View request details
    window.viewRequest = function(requestId) {
        const requests = JSON.parse(localStorage.getItem('serviceRequests')) || [];
        const request = requests.find(r => r.id === requestId);
        
        if (!request) return;
        
        const modal = document.getElementById('requestModal');
        const content = document.getElementById('requestDetailsContent');
        
        content.innerHTML = `
            <div class="info-card">
                <div class="info-item">
                    <span class="label">Request ID:</span>
                    <span class="value">${request.id}</span>
                </div>
                <div class="info-item">
                    <span class="label">User ID:</span>
                    <span class="value">${request.userId}</span>
                </div>
                <div class="info-item">
                    <span class="label">Title:</span>
                    <span class="value">${request.title}</span>
                </div>
                <div class="info-item">
                    <span class="label">Category:</span>
                    <span class="value">${request.category}</span>
                </div>
                <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value">${request.status}</span>
                </div>
                <div class="info-item" style="flex-direction: column; align-items: flex-start;">
                    <span class="label">Details:</span>
                    <span class="value" style="margin-top: 10px;">${request.details}</span>
                </div>
            </div>
        `;
        
        document.getElementById('statusUpdate').value = request.status;
        modal.classList.add('show');
        
        // Update status handler
        document.getElementById('updateStatusBtn').onclick = function() {
            const newStatus = document.getElementById('statusUpdate').value;
            request.status = newStatus;
            localStorage.setItem('serviceRequests', JSON.stringify(requests));
            showNotification('Status updated successfully!');
            modal.classList.remove('show');
            loadServiceRequestsAdmin();
        };
    };
    
    // Close modal
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('requestModal').classList.remove('show');
    });
    
    // Search members
    document.getElementById('searchMembers').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#membersTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // Status filter
    document.getElementById('statusFilter').addEventListener('change', function() {
        const filter = this.value;
        loadServiceRequestsAdmin();
        
        if (filter !== 'all') {
            const rows = document.querySelectorAll('#requestsTableBody tr');
            rows.forEach(row => {
                const statusCell = row.querySelector('.status-badge');
                if (statusCell && !statusCell.textContent.includes(filter)) {
                    row.style.display = 'none';
                }
            });
        }
    });
    
    // Initial load
    loadMembers();
}

// View member details (for admin)
window.viewMemberDetails = function(userId) {
    const users = getUsers();
    const user = users.find(u => u.userId === userId);
    if (user) {
        alert(`
Member Details:
Name: ${user.name}
Email: ${user.email}
User ID: ${user.userId}
Points: ${user.points || 0}
Membership: ${user.membership ? user.membership.type : 'None'}
Registered: ${formatDate(user.registeredDate)}
        `);
    }
};
