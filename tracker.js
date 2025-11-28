// State
let jobs = JSON.parse(localStorage.getItem('jobTrackerData')) || [];
let sectionState = {
    'Researched': true,
    'Applied': true,
    'Interview': true,
    'Offer': true,
    'Rejected': false // Default collapsed
};
let sortConfig = {
    field: 'date',
    direction: 'desc'
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    checkAutoReject();
    render();

    // Form Handler
    document.getElementById('jobForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addJob();
    });
});

// Core Functions
function saveJobs() {
    localStorage.setItem('jobTrackerData', JSON.stringify(jobs));
    render();
}

function addJob() {
    const job = {
        id: Date.now(),
        company: document.getElementById('company').value,
        role: document.getElementById('role').value,
        date: document.getElementById('date').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value,
        link: document.getElementById('link').value,
        followUp: 'Pending'
    };
    jobs.push(job);
    closeModal();
    saveJobs();
}

function deleteJob(id) {
    if (confirm('Delete this job?')) {
        jobs = jobs.filter(j => j.id !== id);
        saveJobs();
    }
}

function updateStatus(id, newStatus) {
    const job = jobs.find(j => j.id === id);
    if (job) {
        job.status = newStatus;
        saveJobs();
    }
}

function updateFollowUp(id, newStatus) {
    const job = jobs.find(j => j.id === id);
    if (job) {
        job.followUp = newStatus;
        saveJobs();
    }
}

// Auto-Reject Logic
function checkAutoReject() {
    const today = new Date();
    let changed = false;
    jobs.forEach(job => {
        if (job.status === 'Applied' && job.date) {
            const appliedDate = new Date(job.date);
            const diffTime = Math.abs(today - appliedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 21) {
                job.status = 'Rejected';
                job.notes = (job.notes ? job.notes + '\n' : '') + '[Auto-Rejected: >21 days silence]';
                changed = true;
            }
        }
    });
    if (changed) {
        localStorage.setItem('jobTrackerData', JSON.stringify(jobs));
    }
}

// Rendering
function render() {
    const container = document.getElementById('job-categories');
    container.innerHTML = '';

    // Stats
    const total = jobs.length;
    const interviews = jobs.filter(j => ['Interview', 'Offer'].includes(j.status)).length;
    const rejected = jobs.filter(j => j.status === 'Rejected').length;
    const rate = total ? Math.round((interviews / total) * 100) : 0;

    document.getElementById('totalApplied').innerText = total;
    document.getElementById('interviews').innerText = interviews;
    document.getElementById('totalRejected').innerText = rejected;
    document.getElementById('responseRate').innerText = `${rate}%`;

    // Render Sections
    renderSection(container, 'Researched', 'researched');
    renderSection(container, 'Offer', 'offer');
    renderSection(container, 'Interview', 'interview');
    renderSection(container, 'Applied', 'applied');
    renderSection(container, 'Rejected', 'rejected');
}

function renderSection(container, category, cssClass) {
    const categoryJobs = jobs.filter(j => j.status === category);

    // Sort
    categoryJobs.sort((a, b) => {
        let valA = a[sortConfig.field];
        let valB = b[sortConfig.field];
        if (sortConfig.field === 'date') {
            return sortConfig.direction === 'asc' ? new Date(valA) - new Date(valB) : new Date(valB) - new Date(valA);
        }
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const isCollapsed = !sectionState[category];

    const section = document.createElement('div');
    section.className = `category-section ${cssClass} ${isCollapsed ? 'collapsed' : ''}`;

    section.innerHTML = `
        <div class="category-header" onclick="toggleSection('${category}')">
            <h2>${category} <span class="count-badge">${categoryJobs.length}</span></h2>
            <span class="toggle-icon">▼</span>
        </div>
        <div class="category-content">
            ${categoryJobs.length === 0 ? '<div style="padding:1.5rem; text-align:center; color:#94a3b8;">No jobs</div>' : `
            <table>
                <thead>
                    <tr>
                        <th onclick="setSort('company')">Company</th>
                        <th onclick="setSort('role')">Role</th>
                        <th onclick="setSort('date')">Date</th>
                        <th>Status</th>
                        <th>Follow Up</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryJobs.map(job => `
                    <tr>
                        <td style="font-weight:600;">${job.company}</td>
                        <td>${job.role}</td>
                        <td>${job.date}</td>
                        <td>
                            <select onchange="updateStatus(${job.id}, this.value)" class="status-select">
                                <option value="Researched" ${job.status === 'Researched' ? 'selected' : ''}>Researched</option>
                                <option value="Applied" ${job.status === 'Applied' ? 'selected' : ''}>Applied</option>
                                <option value="Interview" ${job.status === 'Interview' ? 'selected' : ''}>Interview</option>
                                <option value="Offer" ${job.status === 'Offer' ? 'selected' : ''}>Offer</option>
                                <option value="Rejected" ${job.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                            </select>
                        </td>
                        <td>
                            <select onchange="updateFollowUp(${job.id}, this.value)" class="status-select">
                                <option value="Pending" ${job.followUp === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Sent" ${job.followUp === 'Sent' ? 'selected' : ''}>Sent</option>
                                <option value="Done" ${job.followUp === 'Done' ? 'selected' : ''}>Done</option>
                            </select>
                        </td>
                        <td>
                            <button onclick="openNotesModal(${job.id})" class="btn btn-outline" style="padding:0.3rem 0.6rem; font-size:0.8rem;">Notes</button>
                            <button onclick="deleteJob(${job.id})" class="btn btn-text" style="color:#ef4444;">&times;</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            `}
        </div>
    `;
    container.appendChild(section);
}

// UI Helpers
function toggleSection(category) {
    sectionState[category] = !sectionState[category];
    render();
}

function setSort(field) {
    if (sortConfig.field === field) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.field = field;
        sortConfig.direction = 'asc';
    }
    render();
}

// Modals
function openModal() { document.getElementById('jobModal').classList.add('active'); }
function closeModal() { document.getElementById('jobModal').classList.remove('active'); document.getElementById('jobForm').reset(); }

let currentNoteId = null;
function openNotesModal(id) {
    currentNoteId = id;
    const job = jobs.find(j => j.id === id);
    document.getElementById('editNotes').value = job.notes || '';
    document.getElementById('notesModal').classList.add('active');
}
function closeNotesModal() { document.getElementById('notesModal').classList.remove('active'); currentNoteId = null; }
function saveNote() {
    if (currentNoteId) {
        const job = jobs.find(j => j.id === currentNoteId);
        job.notes = document.getElementById('editNotes').value;
        saveJobs();
        closeNotesModal();
    }
}

// Import/Export
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs));
    const node = document.createElement('a');
    node.setAttribute("href", dataStr);
    node.setAttribute("download", "job_tracker_backup.json");
    document.body.appendChild(node);
    node.click();
    node.remove();
}

document.getElementById('csvInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        parseCSV(e.target.result);
    };
    reader.readAsText(file);
});

document.getElementById('backupInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedJobs = JSON.parse(e.target.result);
            if (Array.isArray(importedJobs)) {
                // Merge or Replace? Let's just append new ones to avoid losing current session data if any, 
                // but usually migration implies full restore. Let's dedupe by ID.
                let count = 0;
                importedJobs.forEach(newJob => {
                    if (!jobs.some(j => j.id === newJob.id)) {
                        jobs.push(newJob);
                        count++;
                    }
                });
                saveJobs();
                alert(`Restored ${count} jobs from backup.`);
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Error parsing backup file: ' + err.message);
        }
    };
    reader.readAsText(file);
});

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    let addedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV parse (assumes no commas in fields for now, or basic split)
        // Better regex for CSV: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

        if (cols.length < 2) continue;

        const company = cols[1];
        const role = cols[0];

        // Dedupe
        if (jobs.some(j => j.company === company && j.role === role)) continue;

        // Map Status
        let status = cols[2];
        if (status === 'Ongoing') status = 'Applied';
        if (!['Researched', 'Applied', 'Interview', 'Offer', 'Rejected'].includes(status)) status = 'Researched'; // Default to Researched

        // Map Date (DD/MM/YYYY -> YYYY-MM-DD)
        let date = cols[3];
        if (date && date.includes('/')) {
            const parts = date.split('/');
            if (parts.length === 3) date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        jobs.push({
            id: Date.now() + i,
            company: company,
            role: role,
            status: status,
            date: date || new Date().toISOString().split('T')[0],
            notes: cols[5] || '',
            followUp: 'Pending'
        });
        addedCount++;
    }
    checkAutoReject(); // Run auto-reject on new data
    saveJobs();
    alert(`Imported ${addedCount} new jobs.`);
}
