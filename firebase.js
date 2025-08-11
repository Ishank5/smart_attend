
let attendanceData = [];
let subjects = [];
let filteredSubjectAttendance = [];
let filteredRollAttendance = [];

// Global cache to store all data for the session
let allAttendanceData = [];
let allSubjectsData = [];
let dataLoaded = false;

 const firebaseConfig = {
    apiKey: "AIzaSyBhWiYMdf4eTCxuEtcJ2p62dXe188SS_8o",
    authDomain: "smart-attendance-1885b.firebaseapp.com",
    projectId: "smart-attendance-1885b",
    storageBucket: "smart-attendance-1885b.firebasestorage.app",
    messagingSenderId: "185742749256",
    appId: "1:185742749256:web:ffb53a86d1387ce0faf27d",
    measurementId: "G-L42FQ00Y5J"
  };
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Subject icons mapping - updated with subjects from your database
const subjectIcons = {
    'Chemistry': '🧪',
    'DAA': '📊',
    'DSA': '💻',
    'Environment': '🌱',
    'Finance': '💰',
    'MachineLearning': '🤖',
    'Physics': '⚡',
    'Probability': '📈',
    'UES913': '📚',
    // Legacy subjects
    'Advanced Mathematics': '📐',
    'Computer Science': '💻',
    'Statistics': '📊',
    'Calculus': '📈',
    'Engineering Mathematics': '⚙️',
    'Mathematics': '🧮',
    'Data Science': '📊'
};

const subjectDescriptions = {
    'Chemistry': 'Fundamental principles of chemistry and chemical reactions.',
    'DAA': 'Design and Analysis of Algorithms - computational problem solving.',
    'DSA': 'Data Structures and Algorithms - efficient data organization and processing.',
    'Environment': 'Environmental science and sustainability studies.',
    'Finance': 'Financial management and economic principles.',
    'MachineLearning': 'Machine learning algorithms and artificial intelligence applications.',
    'Physics': 'Understanding the fundamental laws that govern the physical world.',
    'Probability': 'Statistical analysis and probability theory applications.',
    'UES913': 'Specialized course curriculum and advanced topics.',
    // Legacy descriptions
    'Advanced Mathematics': 'Exploring complex mathematical concepts and their real-world applications.',
    'Computer Science': 'Introduction to programming concepts and computational thinking.',
    'Statistics': 'Data analysis techniques and probability theory applications.',
    'Calculus': 'Differential and integral calculus with engineering applications.',
    'Engineering Mathematics': 'Mathematical methods essential for solving engineering problems.',
    'Mathematics': 'Core mathematical principles and problem-solving techniques.',
    'Data Science': 'Data analysis, visualization, and machine learning fundamentals.'
};

// --- Main Data Fetching Function ---
async function fetchAllAttendanceData() {
    try {
        console.log('Fetching all data at once...');
        
        // Show loading state
        document.getElementById('subjectCardGrid').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Loading all data...
            </div>
        `;
        
        // Fetch subjects and all attendance data in parallel
        const [subjectsResult, attendanceResult] = await Promise.all([
            fetchAllSubjects(),
            fetchAllAttendanceFromAllCollections()
        ]);
        
        // Store in global cache for session
        allSubjectsData = subjectsResult;
        allAttendanceData = attendanceResult;
        dataLoaded = true;
        
        console.log(`Session cache loaded: ${allSubjectsData.length} subjects, ${allAttendanceData.length} attendance records`);
        
        // Process and render
        processSessionData();
        
    } catch (error) {
        console.error('Error fetching all data:', error);
        showErrorMessage(error.message);
    }
}

async function fetchAllSubjects() {
    try {
        console.log('Fetching all subjects...');
        const subjectsSnapshot = await db.collection('subjects').get();
        
        const subjectsData = subjectsSnapshot.docs.map(doc => {
            const subjectName = doc.id;
            const data = doc.data();
            
            // Calculate total classes from database structure
            let totalClasses = 0;
            let classBreakdown = { lab: 0, lect: 0, tut: 0 };
            
            Object.keys(data).forEach(year => {
                if (typeof data[year] === 'object') {
                    Object.keys(data[year]).forEach(classType => {
                        const count = data[year][classType] || 0;
                        totalClasses += count;
                        if (classBreakdown.hasOwnProperty(classType)) {
                            classBreakdown[classType] += count;
                        }
                    });
                }
            });
            
            return {
                id: subjectName,
                name: subjectName,
                icon: subjectIcons[subjectName] || '📚',
                description: subjectDescriptions[subjectName] || `${subjectName} course curriculum and activities.`,
                totalClasses: totalClasses,
                classBreakdown: classBreakdown,
                totalStudents: 0,
                actualTotalClasses: 0,
                actualClassBreakdown: { lab: 0, lect: 0, tut: 0 }
            };
        });
        
        console.log(`Loaded ${subjectsData.length} subjects from database`);
        return subjectsData;
        
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
    }
}

async function fetchAllAttendanceFromAllCollections() {
    try {
        console.log('Fetching attendance collections list...');
        
        // First, get the list of active attendance collections from attendance_collections
        const collectionsSnapshot = await db.collection('attendance_collections').get();
        
        if (collectionsSnapshot.empty) {
            console.log('No attendance collections found in attendance_collections');
            return [];
        }
        
        // Extract collection names from document IDs
        const activeCollections = collectionsSnapshot.docs.map(doc => doc.id);
        console.log(`Found ${activeCollections.length} active collections:`, activeCollections);
        
        // Fetch data from all active collections in parallel
        const attendancePromises = activeCollections.map(collectionName => 
            db.collection(collectionName)
              .get()
              .then(snapshot => {
                  if (!snapshot.empty) {
                      console.log(`✓ Fetched ${snapshot.docs.length} records from ${collectionName}`);
                      return snapshot.docs.map(doc => ({
                          id: doc.id,
                          ...doc.data(),
                          collection: collectionName
                      }));
                  }
                  console.log(`✗ No data in ${collectionName}`);
                  return [];
              })
              .catch(error => {
                  console.error(`Error fetching ${collectionName}:`, error);
                  return [];
              })
        );
        
        // Execute all queries in parallel
        const results = await Promise.all(attendancePromises);
        const allAttendance = results.flat();
        
        console.log(`Total attendance records fetched: ${allAttendance.length}`);
        
        // Process and clean the data
        return allAttendance.map(record => ({
            id: record.id,
            date: record.date,
            rollNumber: record.rollNumber,
            subject: record.subject,
            present: record.present || false,
            type: record.type || 'lecture',
            group: record.group || 'N/A',
            deviceRoom: record.deviceRoom,
            isExtra: record.isExtra || false,
            timestamp: record.timestamp,
            collection: record.collection
        }));
        
    } catch (error) {
        console.error('Error fetching attendance collections list:', error);
        return [];
    }
}

function processSessionData() {
    // Process the cached data
    subjects = [...allSubjectsData];
    attendanceData = [...allAttendanceData];
    
    // Update subjects with actual attendance data
    updateSubjectClassCounts();
    
    // Render UI
    renderSubjectCards();
    renderRollAttendanceList();
    
    console.log('Session data processed and UI updated');
}

function updateSubjectClassCounts() {
    subjects.forEach(subject => {
        const subjectAttendance = attendanceData.filter(record => record.subject === subject.name);
        
        // Count different class types from actual attendance data
        const actualBreakdown = {
            lab: subjectAttendance.filter(r => r.type === 'lab').length,
            lect: subjectAttendance.filter(r => r.type === 'lect' || r.type === 'lecture').length,
            tut: subjectAttendance.filter(r => r.type === 'tut' || r.type === 'tutorial').length
        };
        
        // Count unique sessions (by date and type combination)
        const uniqueSessions = new Set(subjectAttendance.map(r => `${r.date}_${r.type}`)).size;
        
        // Count unique students for this subject
        const uniqueStudents = new Set(subjectAttendance.map(r => r.rollNumber)).size;
        
        // Update with actual data if available, otherwise keep database counts
        if (subjectAttendance.length > 0) {
            subject.actualClassBreakdown = actualBreakdown;
            subject.actualTotalClasses = uniqueSessions;
            subject.totalStudents = uniqueStudents;
            subject.totalAttendanceRecords = subjectAttendance.length;
        }
    });
    
    console.log('Updated subjects with attendance data:', subjects.map(s => ({ 
        name: s.name, 
        dbClasses: s.totalClasses,
        actualClasses: s.actualTotalClasses || 0,
        students: s.totalStudents || 0,
        records: s.totalAttendanceRecords || 0
    })));
}

// --- Client-side filtering functions (no more database calls) ---
function filterAttendanceData(filters = {}) {
    if (!dataLoaded) {
        console.log('Data not loaded yet');
        return [];
    }
    
    let filteredData = [...allAttendanceData];
    
    // Apply filters
    if (filters.subject) {
        filteredData = filteredData.filter(r => r.subject === filters.subject);
    }
    
    if (filters.rollNumber) {
        filteredData = filteredData.filter(r => 
            r.rollNumber && r.rollNumber.toLowerCase().includes(filters.rollNumber.toLowerCase())
        );
    }
    
    if (filters.classType) {
        filteredData = filteredData.filter(r => 
            r.type === filters.classType || (filters.classType === 'lect' && r.type === 'lecture')
        );
    }
    
    if (filters.startDate) {
        filteredData = filteredData.filter(r => r.date >= filters.startDate);
    }
    
    if (filters.endDate) {
        filteredData = filteredData.filter(r => r.date <= filters.endDate);
    }
    
    if (filters.present !== undefined) {
        filteredData = filteredData.filter(r => r.present === filters.present);
    }
    
    console.log(`Applied filters, ${filteredData.length} records match`);
    return filteredData;
}

// --- Tab Switching ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        
        // Handle the data-tab attribute properly
        const tabName = btn.dataset.tab;
        if (tabName === 'subjects') {
            // If subject detail panel is open, close it and show subjects grid
            const detailPanel = document.getElementById('subjectAttendancePanel');
            const subjectsGrid = document.getElementById('subjectCardGrid');
            
            if (detailPanel.style.display === 'block') {
                detailPanel.style.display = 'none';
                subjectsGrid.style.display = 'grid';
            }
            
            document.querySelector('.subjects-panel').classList.add('active');
        } else if (tabName === 'attendance') {
            document.querySelector('.attendance-panel').classList.add('active');
        }
    });
});

// --- Subject Cards with New Design ---
function renderSubjectCards() {
    const grid = document.getElementById('subjectCardGrid');
    
    if (subjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <h3>No subjects found</h3>
                <p>No subjects found in your database.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = subjects.map(subject => {
        const classCount = subject.actualTotalClasses || subject.totalClasses || 0;
        const studentCount = subject.totalStudents || 0;
        
        // Calculate progress bars (mock data for visual appeal)
        const studentProgress = Math.min((studentCount / 10) * 100, 100); // Assuming max 10 students per subject
        const classProgress = Math.min((classCount / 10) * 100, 100); // Assuming max 10 classes
        
        return `
            <div class="subject-card" data-subject="${subject.name}" onclick="openSubjectAttendance('${subject.id}')">
                <div class="subject-header">
                    <div class="subject-icon">${subject.icon}</div>
                    <div class="subject-title">${subject.name}</div>
                </div>
                <div class="subject-description">${subject.description}</div>
                <div class="subject-stats">
                    <div class="stat-row">
                        <span class="stat-row-label">Students</span>
                        <div class="stat-row-value">
                            ${studentCount}
                            <div class="stat-bar">
                                <div class="stat-bar-fill" style="width: ${studentProgress}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row-label">Classes</span>
                        <div class="stat-row-value">
                            ${classCount}
                            <div class="stat-bar">
                                <div class="stat-bar-fill" style="width: ${classProgress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="view-details-btn">
                    View Details →
                </button>
            </div>
        `;
    }).join('');
    
    // Update overall stats
    updateDashboardStats();
}

// --- Update Dashboard Stats ---
function updateDashboardStats() {
    // Calculate totals from actual data
    const totalSubjectsCount = subjects.length;
    const totalStudentsCount = new Set(attendanceData.map(r => r.rollNumber)).size;
    const totalClassesCount = subjects.reduce((sum, subject) => sum + (subject.actualTotalClasses || subject.totalClasses || 0), 0);
    const presentRecords = attendanceData.filter(r => r.present).length;
    const totalRecords = attendanceData.length;
    const averageAttendancePercent = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    
    // Update DOM elements
    document.getElementById('totalSubjects').textContent = totalSubjectsCount;
    document.getElementById('totalStudents').textContent = totalStudentsCount;
    document.getElementById('totalClasses').textContent = totalClassesCount;
    document.getElementById('averageAttendance').textContent = averageAttendancePercent + '%';
    
    // Update semester progress (mock calculation)
    const semesterProgress = Math.min(Math.round((totalClassesCount / 50) * 100), 100); // Assuming 50 total classes in semester
    document.getElementById('semesterProgress').textContent = semesterProgress + '%';
    
    // Update progress circle
    const progressCircle = document.querySelector('.progress-circle');
    if (progressCircle) {
        progressCircle.style.background = `conic-gradient(#4f46e5 0% ${semesterProgress}%, #e2e8f0 ${semesterProgress}% 100%)`;
    }
    
    console.log('Dashboard stats updated:', {
        subjects: totalSubjectsCount,
        students: totalStudentsCount,
        classes: totalClassesCount,
        attendance: averageAttendancePercent + '%'
    });
}

// --- Update Date Display ---
function updateHeaderDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('headerDate').textContent = now.toLocaleDateString('en-US', options);
}

// --- Enhanced Process Session Data ---
function processSessionData() {
    // Process the cached data
    subjects = [...allSubjectsData];
    attendanceData = [...allAttendanceData];
    
    // Update subjects with actual attendance data
    updateSubjectClassCounts();
    
    // Update header date
    updateHeaderDate();
    
    // Render UI
    renderSubjectCards();
    renderRollAttendanceList();
    
    console.log('Session data processed and UI updated');
}

// --- Subject Attendance Panel ---
function openSubjectAttendance(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    document.getElementById('subjectCardGrid').style.display = 'none';
    const panel = document.getElementById('subjectAttendancePanel');
    panel.style.display = 'block';
    
    document.getElementById('subjectAttendanceTitle').innerHTML = `
        <span class="subject-icon" style="background: var(--subject-color, #3b82f6);">${subject.icon}</span>
        ${subject.name} Attendance
    `;
    
    document.getElementById('subjectClassType').value = '';
    document.getElementById('subjectStartDate').value = '';
    document.getElementById('subjectEndDate').value = '';
    renderSubjectAttendanceList(subject.id);

    document.getElementById('subjectRefreshBtn').onclick = () => renderSubjectAttendanceList(subject.id);
    document.getElementById('subjectExportBtn').onclick = () => exportAttendanceToExcel(filteredSubjectAttendance, subject.name);
    document.getElementById('subjectClassType').onchange = () => renderSubjectAttendanceList(subject.id);
    document.getElementById('subjectStartDate').onchange = () => renderSubjectAttendanceList(subject.id);
    document.getElementById('subjectEndDate').onchange = () => renderSubjectAttendanceList(subject.id);
    document.getElementById('backToSubjects').onclick = () => {
        panel.style.display = 'none';
        document.getElementById('subjectCardGrid').style.display = 'grid';
    };
}

function renderSubjectAttendanceList(subjectId) {
    const filters = {
        subject: subjectId,
        classType: document.getElementById('subjectClassType').value,
        startDate: document.getElementById('subjectStartDate').value,
        endDate: document.getElementById('subjectEndDate').value
    };
    
    const filteredData = filterAttendanceData(filters);
    filteredSubjectAttendance = filteredData;
    document.getElementById('subjectAttendanceList').innerHTML = renderAttendanceTable(filteredData);
}

// --- Roll Number Search ---
document.getElementById('rollSearchInput').addEventListener('input', renderRollAttendanceList);
document.getElementById('rollClassType').addEventListener('change', renderRollAttendanceList);
document.getElementById('rollStartDate').addEventListener('change', renderRollAttendanceList);
document.getElementById('rollEndDate').addEventListener('change', renderRollAttendanceList);
document.getElementById('rollRefreshBtn').onclick = renderRollAttendanceList;
document.getElementById('rollExportBtn').onclick = () => exportAttendanceToExcel(filteredRollAttendance, "RollNumber");

function renderRollAttendanceList() {
    const filters = {
        rollNumber: document.getElementById('rollSearchInput').value.trim(),
        classType: document.getElementById('rollClassType').value,
        startDate: document.getElementById('rollStartDate').value,
        endDate: document.getElementById('rollEndDate').value
    };
    
    const filteredData = filterAttendanceData(filters);
    filteredRollAttendance = filteredData;
    document.getElementById('rollAttendanceList').innerHTML = renderAttendanceTable(filteredData);
}

// --- Attendance Table ---
function renderAttendanceTable(data) {
    if (!data.length) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3>No records found</h3>
                <p>No attendance data matches your current filters.</p>
            </div>
        `;
    }

    let rows = data.map(r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td>${r.rollNumber || "N/A"}</td>
            <td>${r.subject || "N/A"}</td>
            <td><span class="status-badge status-${r.present ? 'present' : 'absent'}">${r.present ? 'Present' : 'Absent'}</span></td>
            <td>${(r.type||'').toUpperCase()}</td>
            <td>${r.group || "N/A"}</td>
            <td>${formatTimestamp(r.timestamp)}</td>
        </tr>
    `).join('');
    
    return `
        <table class="attendance-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Roll Number</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Group</th>
                    <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function formatDate(date) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
}

function formatTimestamp(ts) {
    if (!ts) return "N/A";
    
    try {
        let date;
        
        // Handle Firestore Timestamp objects
        if (ts && typeof ts === 'object' && ts.seconds) {
            date = new Date(ts.seconds * 1000);
        }
        // Handle regular Date objects or date strings
        else if (typeof ts === "string") {
            date = new Date(ts);
        }
        // Handle timestamp objects with toDate method
        else if (ts && typeof ts.toDate === 'function') {
            date = ts.toDate();
        }
        // Handle numeric timestamps
        else if (typeof ts === 'number') {
            date = new Date(ts);
        }
        else {
            return "Invalid timestamp";
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return "Invalid date";
        }
        
        // Format as readable date and time
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return "Format error";
    }
}

// --- Export function ---
function exportAttendanceToExcel(data, name) {
    if (!data || !data.length) {
        alert("No data to export!");
        return;
    }
    
    // Prepare data for Excel
    const worksheetData = [
        ["Date", "Roll Number", "Subject", "Status", "Type", "Group", "Device Room", "Timestamp"]
    ];
    
    data.forEach(r => {
        worksheetData.push([
            r.date || "",
            r.rollNumber || "",
            r.subject || "",
            r.present ? "Present" : "Absent",
            (r.type || "").toUpperCase(),
            r.group || "",
            r.deviceRoom || "",
            formatTimestamp(r.timestamp)
        ]);
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better formatting
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 15 }, // Roll Number
        { wch: 20 }, // Subject
        { wch: 10 }, // Status
        { wch: 8 },  // Type
        { wch: 8 },  // Group
        { wch: 15 }, // Device Room
        { wch: 20 }  // Timestamp
    ];
    ws['!cols'] = colWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Data");
    
    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${name}_attendance_${currentDate}.xlsx`;
    
    // Write and download the file
    XLSX.writeFile(wb, filename);
}

// --- Error handling functions ---
function showErrorMessage(error) {
    document.getElementById('subjectCardGrid').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Error loading data</h3>
            <p>There was an error connecting to your database: ${error}</p>
        </div>
    `;
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', fetchAllAttendanceData);
