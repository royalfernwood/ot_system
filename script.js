// Data Storage (In production, this would be a backend database)
let otRequests = [];
let currentUser = null;
let employeeCounter = 1;

const departments = [
    "Quality Assurance", "HR & Admin", "Dispatch", "Engineering", "Finance",
    "Procurement", "National Sales", "Export / International Marketing",
    "Moulding & Modelling", "Preparation", "Forming",
    "Glazing, Repair & Handpainting", "Glost Kiln", "Biscuit Kiln",
    "Bisqueware Store", "R&D", "Whiteware Inspection", "Printing",
    "Whiteware Stores", "General Stores", "Planning", "Decoration",
    "ERP and It", "Decoration Kiln", "Decoration Inspection",
    "Packing", "Finished Goods", "Whiteware Yard", "Medical Centre"
];

const users = {
    'pm001': { role: 'prodmanager', department: null, name: 'Production Manager', password: 'admin' },
    'hr001': { role: 'hr', department: 'HR & Admin', name: 'HR Officer', password: 'admin' }
};

// Generate Department Logins
departments.forEach(dept => {
    const code = dept.toLowerCase().replace(/ & /g, '_').replace(/ \/ /g, '_').replace(/ /g, '_');
    const simplePass = dept.toLowerCase().replace(/ & /g, '').replace(/ \/ /g, '').replace(/ /g, '') + '123';

    // Coordinator login
    users[`${code}_c`] = {
        role: 'coordinator',
        department: dept,
        name: `${dept} Coordinator`,
        password: simplePass
    };

    // Department Head login
    users[`${code}_h`] = {
        role: 'depthead',
        department: dept,
        name: `${dept} Head`,
        password: simplePass
    };
});

// --- Initialization ---

window.addEventListener('load', () => {
    initializeDemoData();
    setupEventListeners();
});

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', handleRegistration);
    }

    const masterOTFrom = document.getElementById('masterOTFrom');
    const masterOTTo = document.getElementById('masterOTTo');

    if (masterOTFrom && masterOTTo) {
        masterOTFrom.addEventListener('change', calculateMasterOTHours);
        masterOTTo.addEventListener('change', calculateMasterOTHours);
    }
}

// --- Auth Functions ---

function checkUserRole() {
    const username = document.getElementById('username').value.trim();
    const departmentGroup = document.getElementById('departmentGroup');
    const departmentSelect = document.getElementById('department');

    if (users[username]) {
        const userRole = users[username].role;

        // Show department dropdown only for coordinator and department head
        if (userRole === 'coordinator' || userRole === 'depthead') {
            departmentGroup.style.display = 'block';
            departmentSelect.required = true;

            // Pre-select department if available
            if (users[username].department) {
                departmentSelect.value = users[username].department;
            }
        } else {
            departmentGroup.style.display = 'none';
            departmentSelect.required = false;
            departmentSelect.value = '';
        }
    } else {
        departmentGroup.style.display = 'block';
        departmentSelect.required = true;
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const department = document.getElementById('department').value;

    if (users[username]) {
        const user = users[username];

        // Validate password
        if (user.password && password !== user.password) {
            showNotification('Invalid password', 'danger');
            return;
        }

        if ((user.role === 'coordinator' || user.role === 'depthead') && !department) {
            showNotification('Please select a department', 'danger');
            return;
        }

        currentUser = {
            username: username,
            ...user,
            department: department || user.department
        };

        showDashboard();
        showNotification(`Welcome back, ${currentUser.name}!`, 'success');
    } else {
        showNotification('User not found. Use your department code (e.g. eng_c for Engineering Coordinator)', 'danger');
    }
}

function handleRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const epf = document.getElementById('regEpf').value;
    const username = document.getElementById('regUsername').value.trim();
    const dept = document.getElementById('regDepartment').value;
    const password = document.getElementById('regPassword').value;

    if (users[username]) {
        showNotification('Username already exists', 'danger');
        return;
    }

    // Add new user (In production this would save to DB)
    users[username] = {
        role: 'coordinator', // Default to coordinator for new signups
        department: dept,
        name: name,
        epf: epf,
        password: password
    };

    showNotification('Account created successfully! Please login.', 'success');
    togglePages('loginPage', 'createAccountPage');
}

function togglePages(showId, hideId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(showId).classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');

    document.getElementById('headerUserName').textContent = currentUser.name;
    document.getElementById('headerUserRole').textContent = getRoleDisplay(currentUser.role);

    // Hide all dashboards first
    ['coordinatorDashboard', 'deptHeadDashboard', 'prodManagerDashboard', 'hrDashboard'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });

    // Show appropriate dashboard
    if (currentUser.role === 'coordinator') {
        document.getElementById('coordinatorDashboard').classList.remove('hidden');
        loadCoordinatorDashboard();
    } else if (currentUser.role === 'depthead') {
        document.getElementById('deptHeadDashboard').classList.remove('hidden');
        loadDeptHeadDashboard();
    } else if (currentUser.role === 'prodmanager') {
        document.getElementById('prodManagerDashboard').classList.remove('hidden');
        loadProdManagerDashboard();
    } else if (currentUser.role === 'hr') {
        document.getElementById('hrDashboard').classList.remove('hidden');
        loadHRDashboard();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('departmentGroup').style.display = 'none';
}

// --- Calculation Helpers ---

function calculateHours(from, to) {
    const [fromH, fromM] = from.split(':').map(Number);
    const [toH, toM] = to.split(':').map(Number);

    let fromMinutes = fromH * 60 + fromM;
    let toMinutes = toH * 60 + toM;

    if (toMinutes < fromMinutes) {
        toMinutes += 24 * 60; // Next day
    }

    return (toMinutes - fromMinutes) / 60;
}

function calculateMasterOTHours() {
    const from = document.getElementById('masterOTFrom').value;
    const to = document.getElementById('masterOTTo').value;

    if (from && to) {
        const hours = calculateHours(from, to);
        document.getElementById('masterOTHours').textContent = hours.toFixed(1);

        // Update all employee entries
        document.querySelectorAll('.employee-entry').forEach(entry => {
            const empFrom = entry.querySelector('.emp-ot-from');
            const empTo = entry.querySelector('.emp-ot-to');
            if (empFrom && empTo) {
                empFrom.value = from;
                empTo.value = to;
                calculateEmployeeOTHours(empFrom);
            }
        });
    }
}

function calculateEmployeeOTHours(element) {
    const entry = element.closest('.employee-entry');
    const from = entry.querySelector('.emp-ot-from').value;
    const to = entry.querySelector('.emp-ot-to').value;

    if (from && to) {
        const hours = calculateHours(from, to);
        entry.querySelector('.emp-ot-hours').value = hours.toFixed(1);
    }
}

// --- Coordinator Functions ---

function addEmployeeEntry() {
    const masterDate = document.getElementById('masterOTDate').value;
    const masterFrom = document.getElementById('masterOTFrom').value;
    const masterTo = document.getElementById('masterOTTo').value;
    const masterHours = document.getElementById('masterOTHours').textContent;

    const entryId = 'emp_' + employeeCounter++;
    const entryHTML = `
        <div class="employee-entry" id="${entryId}">
            <div class="employee-grid">
                <div class="form-group">
                    <label>Employee Name</label>
                    <input type="text" class="emp-name" placeholder="John Doe" required>
                </div>
                <div class="form-group">
                    <label>EPF Number</label>
                    <input type="text" class="emp-epf" placeholder="0001" onblur="loadEmployeeOTHistory(this)" required>
                </div>
                <div class="form-group">
                    <label>OT Date</label>
                    <input type="date" class="emp-ot-date" value="${masterDate}" required>
                </div>
                <div class="form-group">
                    <label>From</label>
                    <input type="time" class="emp-ot-from" value="${masterFrom}" onchange="calculateEmployeeOTHours(this)" required>
                </div>
                <div class="form-group">
                    <label>To</label>
                    <input type="time" class="emp-ot-to" value="${masterTo}" onchange="calculateEmployeeOTHours(this)" required>
                </div>
                <div class="form-group">
                    <label>OT Hours</label>
                    <input type="number" step="0.5" class="emp-ot-hours" value="${masterHours}" readonly>
                </div>
            </div>
            <div class="ot-status-display">
                <h5>Current OT Status</h5>
                <div class="ot-status-grid" id="${entryId}_status">
                    <div class="ot-status-item">
                        <div class="label">This Month Approved</div>
                        <div class="value">--</div>
                    </div>
                    <div class="ot-status-item">
                        <div class="label">Pending</div>
                        <div class="value">--</div>
                    </div>
                    <div class="ot-status-item">
                        <div class="label">Total This Year</div>
                        <div class="value">--</div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn-remove" onclick="removeEmployeeEntry('${entryId}')">Remove Employee</button>
        </div>
    `;

    document.getElementById('employeeEntries').insertAdjacentHTML('beforeend', entryHTML);
}

function removeEmployeeEntry(entryId) {
    document.getElementById(entryId).remove();
}

function loadEmployeeOTHistory(epfInput) {
    const epf = epfInput.value.trim();
    if (!epf) return;

    const entry = epfInput.closest('.employee-entry');
    const statusContainer = entry.querySelector('.ot-status-grid');

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let monthApproved = 0;
    let pending = 0;
    let yearTotal = 0;

    otRequests.filter(r => r.epf === epf).forEach(req => {
        const reqDate = new Date(req.date);

        if (req.status === 'Final Approved') {
            if (reqDate.getMonth() === thisMonth && reqDate.getFullYear() === thisYear) {
                monthApproved += parseFloat(req.hours);
            }
            if (reqDate.getFullYear() === thisYear) {
                yearTotal += parseFloat(req.hours);
            }
        } else if (req.status.includes('Pending')) {
            pending += parseFloat(req.hours);
        }
    });

    statusContainer.innerHTML = `
        <div class="ot-status-item">
            <div class="label">This Month Approved</div>
            <div class="value">${monthApproved.toFixed(1)} hrs</div>
        </div>
        <div class="ot-status-item">
            <div class="label">Pending</div>
            <div class="value">${pending.toFixed(1)} hrs</div>
        </div>
        <div class="ot-status-item">
            <div class="label">Total This Year</div>
            <div class="value">${yearTotal.toFixed(1)} hrs</div>
        </div>
    `;
}

function submitOTRequests() {
    const entries = document.querySelectorAll('.employee-entry');

    if (entries.length === 0) {
        showNotification('Please add at least one employee', 'warning');
        return;
    }

    let submitted = 0;
    entries.forEach(entry => {
        const name = entry.querySelector('.emp-name').value.trim();
        const epf = entry.querySelector('.emp-epf').value.trim();
        const date = entry.querySelector('.emp-ot-date').value;
        const from = entry.querySelector('.emp-ot-from').value;
        const to = entry.querySelector('.emp-ot-to').value;
        const hours = entry.querySelector('.emp-ot-hours').value;

        if (name && epf && date && from && to) {
            const request = {
                id: 'OT' + Date.now() + Math.random().toString(36).substr(2, 9),
                department: currentUser.department,
                name: name,
                epf: epf,
                date: date,
                from: from,
                to: to,
                hours: parseFloat(hours),
                status: 'Pending - Department Head',
                submittedBy: currentUser.username,
                submittedDate: new Date().toISOString(),
                history: [{
                    action: 'Submitted',
                    by: currentUser.name,
                    date: new Date().toISOString()
                }]
            };

            otRequests.push(request);
            submitted++;
        }
    });

    if (submitted > 0) {
        showNotification(`Successfully submitted ${submitted} OT request(s)`, 'success');
        document.getElementById('employeeEntries').innerHTML = '';
        document.getElementById('masterOTDate').value = '';
        document.getElementById('masterOTFrom').value = '';
        document.getElementById('masterOTTo').value = '';
        document.getElementById('masterOTHours').textContent = '0.0';
        loadCoordinatorDashboard();
    } else {
        showNotification('Please fill in all required fields for each employee', 'warning');
    }
}

function loadCoordinatorDashboard() {
    const userRequests = otRequests.filter(r =>
        r.department === currentUser.department && r.submittedBy === currentUser.username
    );

    document.getElementById('coordTotalRequests').textContent = userRequests.length;
    document.getElementById('coordPending').textContent = userRequests.filter(r => r.status.includes('Pending')).length;
    document.getElementById('coordApproved').textContent = userRequests.filter(r => r.status === 'Final Approved').length;
    document.getElementById('coordRejected').textContent = userRequests.filter(r => r.status.includes('Rejected')).length;

    displayCoordRequests(userRequests);
}

function displayCoordRequests(requests) {
    const tbody = document.getElementById('coordRequestsBody');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No requests found</td></tr>';
        return;
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.date}</td>
            <td>${req.name}</td>
            <td>${req.epf}</td>
            <td>${req.from}</td>
            <td>${req.to}</td>
            <td>${req.hours.toFixed(1)}</td>
            <td>${getStatusBadge(req.status)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterCoordRequests() {
    const status = document.getElementById('coordFilterStatus').value;
    let requests = otRequests.filter(r =>
        r.department === currentUser.department && r.submittedBy === currentUser.username
    );

    if (status) {
        requests = requests.filter(r => r.status === status);
    }

    displayCoordRequests(requests);
}

// --- Department Head Functions ---

function loadDeptHeadDashboard() {
    const deptRequests = otRequests.filter(r => r.department === currentUser.department);

    document.getElementById('deptPending').textContent = deptRequests.filter(r => r.status === 'Pending - Department Head').length;
    document.getElementById('deptApproved').textContent = deptRequests.filter(r => r.status.includes('Approved') && r.status.includes('Department')).length;
    document.getElementById('deptRejected').textContent = deptRequests.filter(r => r.status === 'Rejected - Department Head').length;

    displayDeptRequests(deptRequests);
}

function displayDeptRequests(requests) {
    const tbody = document.getElementById('deptRequestsBody');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">No requests found</td></tr>';
        return;
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const tr = document.createElement('tr');
        const canApprove = req.status === 'Pending - Department Head';

        tr.innerHTML = `
            <td>${req.date}</td>
            <td>${req.name}</td>
            <td>${req.epf}</td>
            <td>${req.from}</td>
            <td>${req.to}</td>
            <td>${req.hours.toFixed(1)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>
                ${canApprove ? `
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm" onclick="approveRequest('${req.id}', 'depthead')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectRequest('${req.id}', 'depthead')">Reject</button>
                    </div>
                ` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterDeptRequests() {
    const date = document.getElementById('deptFilterDate').value;
    const status = document.getElementById('deptFilterStatus').value;

    let requests = otRequests.filter(r => r.department === currentUser.department);

    if (date) requests = requests.filter(r => r.date === date);
    if (status) requests = requests.filter(r => r.status === status);

    displayDeptRequests(requests);
}

// --- Production Manager Functions ---

function loadProdManagerDashboard() {
    const allRequests = otRequests;

    document.getElementById('pmTotalRequests').textContent = allRequests.length;
    document.getElementById('pmPending').textContent = allRequests.filter(r => r.status === 'Pending - Production Manager').length;
    document.getElementById('pmApproved').textContent = allRequests.filter(r => r.status === 'Final Approved').length;

    const totalHours = allRequests.filter(r => r.status === 'Final Approved').reduce((sum, r) => sum + r.hours, 0);
    document.getElementById('pmTotalHours').textContent = totalHours.toFixed(1);

    updateDepartmentSummary();
    displayPMRequests(allRequests);
}

function updateDepartmentSummary() {
    const tbody = document.getElementById('pmDeptSummaryBody');
    tbody.innerHTML = '';

    const departments = [...new Set(otRequests.map(r => r.department))].sort();

    departments.forEach(dept => {
        const deptRequests = otRequests.filter(r => r.department === dept);
        const totalHours = deptRequests.filter(r => r.status === 'Final Approved').reduce((sum, r) => sum + r.hours, 0);
        const pending = deptRequests.filter(r => r.status.includes('Pending')).length;
        const approved = deptRequests.filter(r => r.status === 'Final Approved').length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${dept}</strong></td>
            <td>${deptRequests.length}</td>
            <td>${totalHours.toFixed(1)} hrs</td>
            <td>${pending}</td>
            <td>${approved}</td>
        `;
        tbody.appendChild(tr);
    });
}

function displayPMRequests(requests) {
    const tbody = document.getElementById('pmRequestsBody');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #666;">No requests found</td></tr>';
        return;
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const tr = document.createElement('tr');
        const canApprove = req.status === 'Pending - Production Manager';

        tr.innerHTML = `
            <td>${req.date}</td>
            <td>${req.department}</td>
            <td>${req.name}</td>
            <td>${req.epf}</td>
            <td>${req.from}</td>
            <td>${req.to}</td>
            <td>${req.hours.toFixed(1)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>
                ${canApprove ? `
                    <div class="action-buttons">
                        <button class="btn btn-success btn-sm" onclick="approveRequest('${req.id}', 'prodmanager')">Approve</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectRequest('${req.id}', 'prodmanager')">Reject</button>
                    </div>
                ` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterPMRequests() {
    const dept = document.getElementById('pmFilterDept').value;
    const dateFrom = document.getElementById('pmFilterDateFrom').value;
    const dateTo = document.getElementById('pmFilterDateTo').value;
    const status = document.getElementById('pmFilterStatus').value;

    let requests = otRequests;

    if (dept) requests = requests.filter(r => r.department === dept);
    if (dateFrom) requests = requests.filter(r => r.date >= dateFrom);
    if (dateTo) requests = requests.filter(r => r.date <= dateTo);
    if (status) requests = requests.filter(r => r.status === status);

    displayPMRequests(requests);
}

// --- Combined Approval Functions ---

function approveRequest(requestId, role) {
    const request = otRequests.find(r => r.id === requestId);
    if (!request) return;

    if (role === 'depthead') {
        request.status = 'Pending - Production Manager';
        request.history.push({
            action: 'Approved by Department Head',
            by: currentUser.name,
            date: new Date().toISOString()
        });
        loadDeptHeadDashboard();
    } else if (role === 'prodmanager') {
        request.status = 'Final Approved';
        request.history.push({
            action: 'Final Approved by Production Manager',
            by: currentUser.name,
            date: new Date().toISOString()
        });
        loadProdManagerDashboard();
    }

    showNotification('Request approved successfully', 'success');
}

function rejectRequest(requestId, role) {
    const request = otRequests.find(r => r.id === requestId);
    if (!request) return;

    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;

    if (role === 'depthead') {
        request.status = 'Rejected - Department Head';
    } else if (role === 'prodmanager') {
        request.status = 'Rejected - Production Manager';
    }

    request.rejectionReason = reason;
    request.history.push({
        action: `Rejected by ${role === 'depthead' ? 'Department Head' : 'Production Manager'}`,
        by: currentUser.name,
        reason: reason,
        date: new Date().toISOString()
    });

    if (role === 'depthead') loadDeptHeadDashboard();
    else loadProdManagerDashboard();

    showNotification('Request rejected', 'info');
}

// --- HR Dashboard Functions ---

function loadHRDashboard() {
    const allRequests = otRequests;

    document.getElementById('hrTotalRequests').textContent = allRequests.length;
    document.getElementById('hrApproved').textContent = allRequests.filter(r => r.status === 'Final Approved').length;

    const totalHours = allRequests.filter(r => r.status === 'Final Approved').reduce((sum, r) => sum + r.hours, 0);
    document.getElementById('hrTotalHours').textContent = totalHours.toFixed(1);

    const now = new Date();
    const thisMonth = now.getMonth();
    const monthHours = allRequests.filter(r => {
        const reqDate = new Date(r.date);
        return r.status === 'Final Approved' && reqDate.getMonth() === thisMonth;
    }).reduce((sum, r) => sum + r.hours, 0);
    document.getElementById('hrMonthHours').textContent = monthHours.toFixed(1);

    displayHRRequests(allRequests);
}

function displayHRRequests(requests) {
    const tbody = document.getElementById('hrRequestsBody');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #666;">No requests found</td></tr>';
        return;
    }

    requests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${req.date}</td>
            <td>${req.department}</td>
            <td>${req.name}</td>
            <td>${req.epf}</td>
            <td>${req.from}</td>
            <td>${req.to}</td>
            <td>${req.hours.toFixed(1)}</td>
            <td>${getStatusBadge(req.status)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterHRRequests() {
    const dept = document.getElementById('hrFilterDept').value;
    const dateFrom = document.getElementById('hrFilterDateFrom').value;
    const dateTo = document.getElementById('hrFilterDateTo').value;
    const month = document.getElementById('hrFilterMonth').value;
    const employee = document.getElementById('hrFilterEmployee').value.toLowerCase();
    const epf = document.getElementById('hrFilterEPF').value.toLowerCase();
    const status = document.getElementById('hrFilterStatus').value;

    let requests = otRequests;

    if (dept) requests = requests.filter(r => r.department === dept);
    if (dateFrom) requests = requests.filter(r => r.date >= dateFrom);
    if (dateTo) requests = requests.filter(r => r.date <= dateTo);
    if (month) {
        const [year, monthNum] = month.split('-');
        requests = requests.filter(r => {
            const reqDate = new Date(r.date);
            return reqDate.getFullYear() == year && (reqDate.getMonth() + 1) == monthNum;
        });
    }
    if (employee) requests = requests.filter(r => r.name.toLowerCase().includes(employee));
    if (epf) requests = requests.filter(r => r.epf.toLowerCase().includes(epf));
    if (status) {
        if (status === 'Pending') {
            requests = requests.filter(r => r.status.includes('Pending'));
        } else if (status === 'Rejected') {
            requests = requests.filter(r => r.status.includes('Rejected'));
        } else {
            requests = requests.filter(r => r.status === status);
        }
    }

    displayHRRequests(requests);
}

// --- Export Functions ---

function exportToCSV() {
    let requests = otRequests;

    // Use HR filters if on HR dashboard
    if (currentUser.role === 'hr') {
        const dept = document.getElementById('hrFilterDept').value;
        const dateFrom = document.getElementById('hrFilterDateFrom').value;
        const dateTo = document.getElementById('hrFilterDateTo').value;
        const status = document.getElementById('hrFilterStatus').value;

        if (dept) requests = requests.filter(r => r.department === dept);
        if (dateFrom) requests = requests.filter(r => r.date >= dateFrom);
        if (dateTo) requests = requests.filter(r => r.date <= dateTo);
        if (status) {
            if (status === 'Pending') requests = requests.filter(r => r.status.includes('Pending'));
            else if (status === 'Rejected') requests = requests.filter(r => r.status.includes('Rejected'));
            else requests = requests.filter(r => r.status === status);
        }
    }

    let csv = 'Date,Department,Employee,EPF,From,To,Hours,Status\n';
    requests.forEach(req => {
        csv += `${req.date},${req.department},${req.name},${req.epf},${req.from},${req.to},${req.hours},${req.status}\n`;
    });
    downloadFile(csv, 'ot-report.csv', 'text/csv');
}

function exportToExcel() {
    showNotification('Excel export available as CSV for now.', 'info');
    exportToCSV();
}

function exportMonthlyReport() {
    const month = document.getElementById('hrFilterMonth').value;
    if (!month) {
        showNotification('Please select a month first', 'warning');
        return;
    }
    const [year, monthNum] = month.split('-');
    const requests = otRequests.filter(r => {
        const reqDate = new Date(r.date);
        return reqDate.getFullYear() == year && (reqDate.getMonth() + 1) == monthNum;
    });

    let csv = `Monthly OT Report - ${year}-${monthNum}\n\n`;
    csv += 'Date,Department,Employee,EPF,From,To,Hours,Status\n';
    requests.forEach(req => {
        csv += `${req.date},${req.department},${req.name},${req.epf},${req.from},${req.to},${req.hours},${req.status}\n`;
    });
    downloadFile(csv, `monthly-ot-report-${year}-${monthNum}.csv`, 'text/csv');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- UI Helper Functions ---

function getRoleDisplay(role) {
    const roles = {
        'coordinator': 'Department Coordinator',
        'depthead': 'Department Head',
        'prodmanager': 'Production Manager',
        'hr': 'HR Officer'
    };
    return roles[role] || role;
}

function getStatusBadge(status) {
    let cls = '';
    if (status.includes('Pending')) cls = 'status-pending';
    else if (status === 'Final Approved') cls = 'status-final';
    else if (status.includes('Approved')) cls = 'status-approved';
    else if (status.includes('Rejected')) cls = 'status-rejected';

    return `<span class="status-badge ${cls}">${status}</span>`;
}

function showNotification(message, type = 'primary') {
    const container = document.getElementById('notificationContainer');
    const note = document.createElement('div');
    note.className = `notification border-${type}`;
    note.innerHTML = `<span>${message}</span>`;
    container.appendChild(note);
    setTimeout(() => {
        note.style.opacity = '0';
        note.style.transform = 'translateX(100%)';
        setTimeout(() => note.remove(), 300);
    }, 3000);
}

// --- Data Layer ---

function initializeDemoData() {
    otRequests = [
        {
            id: 'OT001',
            department: 'Packing',
            name: 'Sunil Silva',
            epf: '1001',
            date: '2026-02-26',
            from: '17:00',
            to: '20:00',
            hours: 3.0,
            status: 'Pending - Department Head',
            submittedBy: 'packing_c',
            submittedDate: new Date().toISOString(),
            history: [{ action: 'Submitted', by: 'Packing Coordinator', date: new Date().toISOString() }]
        },
        {
            id: 'OT002',
            department: 'Engineering',
            name: 'Nimal Silva',
            epf: '1002',
            date: '2026-02-25',
            from: '18:00',
            to: '21:00',
            hours: 3.0,
            status: 'Final Approved',
            submittedBy: 'engineering_c',
            submittedDate: new Date().toISOString(),
            history: [
                { action: 'Submitted', by: 'Engineering Coordinator', date: new Date().toISOString() },
                { action: 'Approved by Department Head', by: 'Engineering Head', date: new Date().toISOString() },
                { action: 'Final Approved by Production Manager', by: 'Production Manager', date: new Date().toISOString() }
            ]
        }
    ];
}
