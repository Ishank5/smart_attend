
  const firebaseConfig = {
    apiKey: "AIzaSyBhWiYMdf4eTCxuEtcJ2p62dXe188SS_8o",
    authDomain: "smart-attendance-1885b.firebaseapp.com",
    projectId: "smart-attendance-1885b",
    storageBucket: "smart-attendance-1885b.firebasestorage.app",
    messagingSenderId: "185742749256",
    appId: "1:185742749256:web:ffb53a86d1387ce0faf27d",
    measurementId: "G-L42FQ00Y5J"
  };


// Sample data that matches your Firebase structure
const sampleAttendanceData = [
    {
        id: "0Nnr7bkXY98sz8Fa0ymw",
        date: "2025-06-25",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: true,
        rollNumber: "102497021",
        subject: "DSA",
        timestamp: "June 25, 2025 at 1:13:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "0r45bAbUtV2p6DZzWMDA",
        date: "2025-06-25",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: false,
        rollNumber: "102497022",
        subject: "DSA",
        timestamp: "June 25, 2025 at 1:15:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "1FMLoFor3SHxaIbA2C4T",
        date: "2025-06-24",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: true,
        rollNumber: "102497021",
        subject: "DBMS",
        timestamp: "June 24, 2025 at 2:30:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "3rKWYhLQ4bIAU3rcNRAQ",
        date: "2025-06-24",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: true,
        rollNumber: "102497023",
        subject: "DBMS",
        timestamp: "June 24, 2025 at 2:32:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "4X4L0GaJkviH8sb6qRZJ",
        date: "2025-06-23",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: false,
        rollNumber: "102497024",
        subject: "OS",
        timestamp: "June 23, 2025 at 3:45:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "5cPQ850BfSh5ZfhM31IJ",
        date: "2025-06-23",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: true,
        rollNumber: "102497025",
        subject: "OS",
        timestamp: "June 23, 2025 at 3:47:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "6bhH9fTaLYEZ5we9BtCE",
        date: "2025-06-22",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: true,
        rollNumber: "102497026",
        subject: "CN",
        timestamp: "June 22, 2025 at 4:15:01 AM UTC+5:30",
        type: "lect"
    },
    {
        id: "7AnF1rHi2DQv8Vhjt5BC",
        date: "2025-06-22",
        deviceRoom: "",
        group: "2014",
        isExtra: false,
        present: false,
        rollNumber: "102497027",
        subject: "CN",
        timestamp: "June 22, 2025 at 4:17:01 AM UTC+5:30",
        type: "lect"
    }
];

let attendanceData = [];
let filteredData = [];
let subjects = [];
let dates = [];
let db;

// Check if Firebase is loaded
function checkFirebaseLoaded() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded');
        showError('Firebase SDK failed to load. Using sample data instead.');
        return false;
    }
    return true;
}

// Initialize Firebase
function initializeFirebase() {
    try {
        if (!checkFirebaseLoaded()) {
            loadSampleData();
            return false;
        }
        
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Firebase initialization failed. Using sample data instead.');
        loadSampleData();
        return false;
    }
}

// Fetch data from Firestore
async function fetchAttendanceData() {
    try {
        if (!db) {
            throw new Error('Firebase not initialized');
        }
        
        showLoading(true);
        console.log("Fetching data from Firestore...");
        
        // Query the attendance_2025_06 collection
        const snapshot = await db.collection("attendance_2025_06").get();
        
        attendanceData = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            attendanceData.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`Fetched ${attendanceData.length} records from Firestore`);
        
        if (attendanceData.length === 0) {
            showError('No attendance records found in the database.');
            loadSampleData();
            return;
        }
        
        filteredData = [...attendanceData];
        populateFilters();
        renderData();
        
        // Update table header to show it's real data
        const tableHeader = document.querySelector('.table-header h2');
        tableHeader.innerHTML = `
            <span>📋</span>
            Attendance Records 
            <span style="color: #10b981; font-size: 0.8rem; font-weight: 500; background: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 6px; margin-left: 8px;">Live Data</span>
        `;
        
    } catch (error) {
        console.error("Error fetching attendance data:", error);
        
        if (error.code === 'permission-denied') {
            showError('Permission denied. Please check your Firestore security rules.');
        } else if (error.code === 'unavailable') {
            showError('Firestore service is currently unavailable. Using sample data.');
        } else {
            showError(`Failed to fetch attendance data: ${error.message}`);
        }
        
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

// Load sample data
function loadSampleData() {
    console.log('Loading sample data...');
    attendanceData = [...sampleAttendanceData];
    filteredData = [...attendanceData];
    populateFilters();
    renderData();
    
    // Update table header to show it's sample data
    const tableHeader = document.querySelector('.table-header h2');
    tableHeader.innerHTML = `
        <span>📋</span>
        Attendance Records 
        <span style="color: #f59e0b; font-size: 0.8rem; font-weight: 500; background: rgba(245, 158, 11, 0.1); padding: 4px 8px; border-radius: 6px; margin-left: 8px;">Sample Data</span>
    `;
}

// Show loading state
function showLoading(show) {
    const tableBody = document.getElementById('attendanceTableBody');
    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 48px;">
                    <div style="display: inline-flex; align-items: center; gap: 12px; padding: 20px 32px; background: linear-gradient(135deg, #e0f2fe, #b3e5fc); border-radius: 16px; color: #0277bd; font-weight: 600;">
                        <div style="width: 20px; height: 20px; border: 2px solid #0277bd; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        Loading attendance data...
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </td>
            </tr>
        `;
    }
}

// Show error message
function showError(message) {
    const tableBody = document.getElementById('attendanceTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 48px;">
                <div style="background: linear-gradient(135deg, #fef2f2, #fecaca); padding: 24px; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.2); color: #991b1b; max-width: 500px; margin: 0 auto;">
                    <div style="font-weight: bold; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>⚠️</span> Notice
                    </div>
                    <div style="margin-bottom: 20px; line-height: 1.6;">${message}</div>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="retryFirebaseConnection()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                            🔄 Retry Firebase
                        </button>
                        <button onclick="loadSampleData()" style="background: linear-gradient(135deg, #059669, #047857); color: white; border: none; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">
                            📝 Use Sample Data
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

// Retry Firebase connection
function retryFirebaseConnection() {
    console.log('Retrying Firebase connection...');
    if (initializeFirebase()) {
        fetchAttendanceData();
    }
}

// Refresh data function
function refreshData() {
    if (db) {
        fetchAttendanceData();
    } else {
        console.log('Firebase not connected, refreshing sample data...');
        loadSampleData();
    }
}

// Initialize the dashboard
async function init() {
    console.log('Initializing Smart Attend dashboard...');
    
    // Add a small delay to ensure Firebase CDN is loaded
    setTimeout(async () => {
        if (initializeFirebase()) {
            await fetchAttendanceData();
        }
        setupEventListeners();
    }, 1000);
}

// Populate filter dropdowns
function populateFilters() {
    subjects = [...new Set(attendanceData.map(record => record.subject))].filter(Boolean);
    dates = [...new Set(attendanceData.map(record => record.date))].filter(Boolean).sort().reverse();

    const subjectFilter = document.getElementById('subjectFilter');
    const dateFilter = document.getElementById('dateFilter');

    // Clear existing options (except first one)
    subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
    dateFilter.innerHTML = '<option value="">All Dates</option>';

    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
    });

    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = new Date(date).toLocaleDateString();
        dateFilter.appendChild(option);
    });

    console.log(`Populated filters: ${subjects.length} subjects, ${dates.length} dates`);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('subjectFilter').addEventListener('change', filterData);
    document.getElementById('dateFilter').addEventListener('change', filterData);
    document.getElementById('rollSearch').addEventListener('input', filterData);
}

// Filter data based on selected filters
function filterData() {
    const selectedSubject = document.getElementById('subjectFilter').value;
    const selectedDate = document.getElementById('dateFilter').value;
    const searchRoll = document.getElementById('rollSearch').value.toLowerCase();

    filteredData = attendanceData.filter(record => {
        const subjectMatch = selectedSubject === 'all' || record.subject === selectedSubject;
        const dateMatch = !selectedDate || record.date === selectedDate;
        const rollMatch = !searchRoll || (record.rollNumber && record.rollNumber.toLowerCase().includes(searchRoll));
        return subjectMatch && dateMatch && rollMatch;
    });

    renderData();
}

// Render all data
function renderData() {
    updateStats();
    renderTable();
}

// Update main statistics (only 3 cards)
function updateStats() {
    const totalRecords = filteredData.length;
    const presentRecords = filteredData.filter(record => record.present === true).length;
    const absentRecords = totalRecords - presentRecords;

    // Add smooth number animation
    animateNumber('totalStudents', totalRecords);
    animateNumber('presentStudents', presentRecords);
    animateNumber('absentStudents', absentRecords);
}

// Animate number changes
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const duration = 300;
    const steps = Math.abs(targetValue - currentValue);
    const stepTime = steps > 0 ? duration / steps : 0;

    if (steps === 0) return;

    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        
        if (current === targetValue) {
            clearInterval(timer);
        }
    }, stepTime);
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    // Handle Firestore timestamp
    if (timestamp && timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString();
    }
    
    // Handle string timestamp
    if (typeof timestamp === 'string') {
        return timestamp;
    }
    
    // Handle regular Date object
    if (timestamp instanceof Date) {
        return timestamp.toLocaleString();
    }
    
    return 'N/A';
}

// Render attendance table
function renderTable() {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 48px;">
                <div style="color: #6b7280; font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div style="font-size: 3rem; opacity: 0.3;">📭</div>
                    <div>No records found matching the selected filters</div>
                    <button onclick="clearFilters()" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 8px;">
                        Clear Filters
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    filteredData.forEach((record, index) => {
        const row = document.createElement('tr');
        
        // Format date
        const formattedDate = record.date ? new Date(record.date).toLocaleDateString() : 'N/A';
        
        // Handle missing fields gracefully
        const rollNumber = record.rollNumber || 'N/A';
        const subject = record.subject || 'N/A';
        const group = record.group || 'N/A';
        const type = record.type ? record.type.toUpperCase() : 'N/A';
        const present = record.present === true;
        
        row.innerHTML = `
            <td style="font-weight: 500;">${formattedDate}</td>
            <td style="font-weight: 600; color: #374151;">${rollNumber}</td>
            <td><span class="subject-badge">${subject}</span></td>
            <td style="color: #6b7280;">${group}</td>
            <td><span class="status-${present ? 'present' : 'absent'}">${present ? 'Present' : 'Absent'}</span></td>
            <td style="color: #6b7280; font-weight: 500;">${type}</td>
            <td style="color: #9ca3af; font-size: 0.875rem;">${formatTimestamp(record.timestamp)}</td>
        `;
        
        // Add stagger animation
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        tbody.appendChild(row);
        
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Clear all filters
function clearFilters() {
    document.getElementById('subjectFilter').value = 'all';
    document.getElementById('dateFilter').value = '';
    document.getElementById('rollSearch').value = '';
    filterData();
}

// Export data to CSV
function exportData() {
    if (filteredData.length === 0) {
        // Show elegant alert
        showCustomAlert('No data to export', 'Please apply filters to get some data first.', 'warning');
        return;
    }

    const csv = ['Date,Roll Number,Subject,Group,Status,Type,Timestamp'];
    filteredData.forEach(record => {
        const date = record.date || '';
        const rollNumber = record.rollNumber || '';
        const subject = record.subject || '';
        const group = record.group || '';
        const status = record.present === true ? 'Present' : 'Absent';
        const type = record.type || '';
        const timestamp = formatTimestamp(record.timestamp).replace(/,/g, ';');
        
        csv.push(`${date},${rollNumber},${subject},${group},${status},${type},${timestamp}`);
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `smart_attend_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show success message
        showCustomAlert('Export Successful!', `Exported ${filteredData.length} records to CSV file.`, 'success');
    }
}

// Custom alert function
function showCustomAlert(title, message, type = 'info') {
    const alertDiv = document.createElement('div');
    const bgColor = type === 'success' ? '#dcfce7' : type === 'warning' ? '#fef3c7' : '#dbeafe';
    const textColor = type === 'success' ? '#166534' : type === 'warning' ? '#92400e' : '#1e40af';
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    alertDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: ${textColor}; padding: 16px 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px; border: 1px solid ${textColor}20;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; margin-bottom: 4px;">
                <span>${icon}</span>
                ${title}
            </div>
            <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.transition = 'all 0.3s ease';
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(alertDiv), 300);
    }, 3000);
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', init);