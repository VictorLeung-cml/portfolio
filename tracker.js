// Data Management
const STORAGE_KEY = 'job_tracker_data';

let jobs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// DOM Elements
const jobTableBody = document.getElementById('jobTableBody');
const totalAppliedEl = document.getElementById('totalApplied');
const interviewsEl = document.getElementById('interviews');
const responseRateEl = document.getElementById('responseRate');
const modal = document.getElementById('jobModal');
const jobForm = document.getElementById('jobForm');

// Functions
function saveJobs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    render();
}

function addJob(e) {
    e.preventDefault();

    const newJob = {
        id: Date.now(),
        company: document.getElementById('company').value,
        role: document.getElementById('role').value,
        date: document.getElementById('date').value,
        status: document.getElementById('status').value,
        link: document.getElementById('link').value
    };

    jobs.unshift(newJob); // Add to top
    saveJobs();
    closeModal();
    jobForm.reset();
}

function deleteJob(id) {
    if (confirm('Are you sure you want to delete this application?')) {
        jobs = jobs.filter(job => job.id !== id);
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

function getStatusClass(status) {
    switch (status) {
        case 'Interview': return 'status-interview';
        case 'Rejected': return 'status-rejected';
        case 'Offer': return 'status-offer';
        default: return 'status-applied';
    }
}

function calculateStats() {
    const total = jobs.length;
    const interviews = jobs.filter(j => j.status === 'Interview' || j.status === 'Offer').length;
    const offers = jobs.filter(j => j.status === 'Offer').length;

    totalAppliedEl.innerText = total;
    interviewsEl.innerText = interviews;

    const rate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    responseRateEl.innerText = `${rate}%`;
}

function render() {
    // Clear table
    jobTableBody.innerHTML = '';

    // Render rows
    jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${job.company}</td>
            <td>${job.role}</td>
            <td>${job.date}</td>
            <td>
                <select onchange="updateStatus(${job.id}, this.value)" class="status-badge ${getStatusClass(job.status)}" style="border:none; cursor:pointer;">
                    <option value="Applied" ${job.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Interview" ${job.status === 'Interview' ? 'selected' : ''}>Interview</option>
                    <option value="Rejected" ${job.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Offer" ${job.status === 'Offer' ? 'selected' : ''}>Offer</option>
                </select>
            </td>
            <td>
                <button onclick="deleteJob(${job.id})" class="action-btn">&times;</button>
            </td>
        `;
        jobTableBody.appendChild(tr);
    });

    calculateStats();
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "job_tracker_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Modal Logic
function openModal() { modal.classList.add('active'); }
function closeModal() { modal.classList.remove('active'); }

// Event Listeners
jobForm.addEventListener('submit', addJob);

// Initial Render
render();
