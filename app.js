document.addEventListener('DOMContentLoaded', () => {
    // --- INITIAL LOAD ---
    const appContainer = document.getElementById('app-container');
    setTimeout(() => {
        appContainer.style.visibility = 'visible';
        appContainer.classList.add('loaded');
    }, 500);

    // --- STATE MANAGEMENT ---
    let symptoms = [
        { id: 1, name: 'Fever' }, { id: 2, name: 'Cough' }, { id: 3, name: 'Sore Throat' },
        { id: 4, name: 'Headache' }, { id: 5, name: 'Body Aches' }, { id: 6, name: 'Rash' },
        { id: 7, name: 'Itchiness' }, { id: 8, name: 'Fatigue' }, { id: 9, name: 'Difficulty Breathing' },
        { id: 10, name: 'Nausea' }, { id: 11, name: 'Vomiting' }
    ];
    let diseases = [
        { id: 1, name: 'Common Cold', description: 'A common viral infection of the nose and throat.', rules: [ { symptomId: 1, condition: 'equal', value: 1 }, { symptomId: 2, condition: 'equal', value: 1 } ] },
        { id: 2, name: 'Influenza (Flu)', description: 'A contagious respiratory illness caused by influenza viruses.', rules: [ { symptomId: 1, condition: 'equal', value: 1 }, { symptomId: 4, condition: 'equal', value: 1 }, { symptomId: 5, condition: 'more_than', value: 2 } ] },
        { id: 3, name: 'Allergic Reaction', description: 'The body\'s reaction to a normally harmless substance.', rules: [ { symptomId: 6, condition: 'equal', value: 1 }, { symptomId: 7, condition: 'equal', value: 1 } ] }
    ];
    let diagnosisHistory = [];
    let nextSymptomId = 12;
    let nextDiseaseId = 4;
    let tempSelectedSymptoms = [];

    // --- UI ELEMENTS ---
    const loader = document.getElementById('loader');
    const navLinks = document.querySelectorAll('.sidebar-link');
    const pages = document.querySelectorAll('.page-content');
    
    // Settings
    const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
    const settingsTabs = document.querySelectorAll('#settings .sub-page');
    const symptomsTableBody = document.getElementById('symptoms-table-body');
    const newSymptomBtn = document.getElementById('new-symptom-btn');
    const symptomModal = document.getElementById('symptom-modal');
    const symptomModalTitle = document.getElementById('symptom-modal-title');
    const editingSymptomIdInput = document.getElementById('editing-symptom-id');
    const symptomNameInput = document.getElementById('symptom-name-input');
    const saveSymptomBtn = document.getElementById('save-symptom-btn');
    const diseasesTableBody = document.getElementById('diseases-table-body');
    const newDiseaseBtn = document.getElementById('new-disease-btn');
    const diseaseModal = document.getElementById('disease-modal');
    const diseaseModalTitle = document.getElementById('disease-modal-title');
    const editingDiseaseIdInput = document.getElementById('editing-disease-id');
    const diseaseNameInput = document.getElementById('disease-name-input');
    const diseaseDescInput = document.getElementById('disease-desc-input');
    const diseaseRulesContainer = document.getElementById('disease-rules-container');
    const symptomSelect = document.getElementById('symptom-select');
    const addDiseaseRuleBtn = document.getElementById('add-disease-rule-btn');
    const saveDiseaseBtn = document.getElementById('save-disease-btn');
    
    // Diagnosis Test
    const newConsultationBtn = document.getElementById('new-consultation-btn');
    const historyTableBody = document.getElementById('history-table-body');
    const consultationModal = document.getElementById('consultation-modal');
    const consultationModalTitle = consultationModal.querySelector('h3');
    const consultationModalBody = document.getElementById('consultation-modal-body');
    const consultationModalFooter = document.getElementById('consultation-modal-footer');

    // --- HELPERS ---
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';
    const getSymptomName = (id) => symptoms.find(s => s.id === id)?.name || 'Unknown';

    // --- NAVIGATION ---
    const handleNavigation = (hash) => {
        const targetId = hash.substring(1) || 'dashboard';
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`));
        pages.forEach(page => page.classList.toggle('active', page.id === targetId));
        if (targetId === 'test') {
            renderDiagnosisHistory();
        } else if (targetId === 'settings') {
            renderSymptomsTable();
            renderDiseasesTable();
        }
    };
    window.addEventListener('hashchange', () => handleNavigation(window.location.hash));
    document.getElementById('sidebar-nav').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) { e.preventDefault(); window.location.hash = link.getAttribute('href'); }
    });

    // --- SETTINGS TABS ---
    settingsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            settingsTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            settingsTabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // --- MODAL HANDLING ---
    const openModal = (modal) => modal.classList.add('visible');
    const closeModal = (modal) => modal.classList.remove('visible');
    symptomModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(symptomModal));
    diseaseModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(diseaseModal));
    consultationModal.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(consultationModal));

    // --- SYMPTOM MANAGEMENT ---
    const renderSymptomsTable = () => {
        symptomsTableBody.innerHTML = '';
        symptoms.forEach(symptom => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${symptom.name}</td>
                <td class="actions-cell">
                    <button class="btn btn-warning edit-symptom-btn" style="padding: 0.5rem;" data-id="${symptom.id}" title="Edit"><svg style="width:1rem; height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg></button>
                    <button class="btn btn-danger delete-symptom-btn" style="padding: 0.5rem;" data-id="${symptom.id}" title="Delete"><svg style="width:1rem; height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </td>
            `;
            row.querySelector('.edit-symptom-btn').addEventListener('click', (e) => {
                const symptom = symptoms.find(s => s.id == e.currentTarget.dataset.id);
                if(symptom) {
                    editingSymptomIdInput.value = symptom.id;
                    symptomNameInput.value = symptom.name;
                    symptomModalTitle.textContent = 'Edit Symptom';
                    openModal(symptomModal);
                }
            });
            row.querySelector('.delete-symptom-btn').addEventListener('click', (e) => {
                if (confirm('Are you sure? Deleting a symptom will also affect disease rules.')) {
                    const symptomId = parseInt(e.currentTarget.dataset.id);
                    symptoms = symptoms.filter(s => s.id !== symptomId);
                    diseases.forEach(d => { d.rules = d.rules.filter(r => r.symptomId !== symptomId); });
                    renderSymptomsTable();
                    renderDiseasesTable();
                }
            });
            symptomsTableBody.appendChild(row);
        });
    };
    newSymptomBtn.addEventListener('click', () => {
        editingSymptomIdInput.value = '';
        symptomNameInput.value = '';
        symptomModalTitle.textContent = 'New Symptom';
        openModal(symptomModal);
    });
    saveSymptomBtn.addEventListener('click', () => {
        const name = symptomNameInput.value.trim();
        const id = editingSymptomIdInput.value ? parseInt(editingSymptomIdInput.value) : null;
        if (!name) return alert('Symptom name cannot be empty.');
        if (id) {
            const symptom = symptoms.find(s => s.id === id);
            if (symptom) symptom.name = name;
        } else {
            symptoms.push({ id: nextSymptomId++, name });
        }
        renderSymptomsTable();
        closeModal(symptomModal);
    });

    // --- DISEASE MANAGEMENT ---
    const renderDiseasesTable = () => {
        diseasesTableBody.innerHTML = '';
        diseases.forEach(disease => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${disease.name}</td>
                <td style="white-space: normal;">${disease.description}</td>
                <td>${disease.rules.length}</td>
                <td class="actions-cell">
                    <button class="btn btn-warning edit-disease-btn" style="padding: 0.5rem;" data-id="${disease.id}" title="Edit"><svg style="width:1rem; height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg></button>
                    <button class="btn btn-danger delete-disease-btn" style="padding: 0.5rem;" data-id="${disease.id}" title="Delete"><svg style="width:1rem; height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </td>
            `;
            row.querySelector('.edit-disease-btn').addEventListener('click', (e) => {
                const disease = diseases.find(d => d.id == e.currentTarget.dataset.id);
                if (disease) {
                    editingDiseaseIdInput.value = disease.id;
                    diseaseNameInput.value = disease.name;
                    diseaseDescInput.value = disease.description;
                    diseaseModalTitle.textContent = 'Edit Disease';
                    renderDiseaseRuleRows(disease.rules);
                    openModal(diseaseModal);
                }
            });
            row.querySelector('.delete-disease-btn').addEventListener('click', (e) => {
                if (confirm('Are you sure?')) {
                    diseases = diseases.filter(d => d.id != e.currentTarget.dataset.id);
                    renderDiseasesTable();
                }
            });
            diseasesTableBody.appendChild(row);
        });
    };
    newDiseaseBtn.addEventListener('click', () => {
        editingDiseaseIdInput.value = '';
        diseaseNameInput.value = '';
        diseaseDescInput.value = '';
        diseaseRulesContainer.innerHTML = '';
        diseaseModalTitle.textContent = 'Create New Disease';
        populateSymptomSelect([]);
        openModal(diseaseModal);
    });
    const populateSymptomSelect = (existingRuleIds) => {
        const availableSymptoms = symptoms.filter(s => !existingRuleIds.includes(s.id));
        symptomSelect.innerHTML = availableSymptoms.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    };
    const renderDiseaseRuleRows = (rules) => {
        diseaseRulesContainer.innerHTML = '';
        rules.forEach(rule => {
            const symptom = symptoms.find(s => s.id === rule.symptomId);
            if (!symptom) return;
            const ruleRow = document.createElement('div');
            ruleRow.className = 'flex items-center gap-2 p-2';
            ruleRow.style.backgroundColor = '#f9fafb';
            ruleRow.style.borderRadius = '0.25rem';
            ruleRow.dataset.symptomId = symptom.id;
            ruleRow.innerHTML = `
                <input type="text" value="${symptom.name}" class="form-input" style="background-color: #e5e7eb; flex-grow: 1;" readonly>
                <select class="form-select condition-select" style="width: 10rem;">
                    <option value="more_than" ${rule.condition === 'more_than' ? 'selected' : ''}>More Than</option>
                    <option value="less_than" ${rule.condition === 'less_than' ? 'selected' : ''}>Less Than</option>
                    <option value="equal" ${rule.condition === 'equal' ? 'selected' : ''}>Equal to</option>
                </select>
                <input type="number" value="${rule.value}" min="1" class="form-input value-input" style="width: 6rem;">
                <button class="remove-rule-btn" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-size:1.5rem; line-height:1;">&times;</button>
            `;
            diseaseRulesContainer.appendChild(ruleRow);
        });
        const existingIds = rules.map(r => r.symptomId);
        populateSymptomSelect(existingIds);
    };
    addDiseaseRuleBtn.addEventListener('click', () => {
        const symptomId = parseInt(symptomSelect.value);
        if (!symptomId) return;
        const currentRules = Array.from(diseaseRulesContainer.querySelectorAll('[data-symptom-id]')).map(row => ({
            symptomId: parseInt(row.dataset.symptomId),
            condition: row.querySelector('.condition-select').value,
            value: parseInt(row.querySelector('.value-input').value) || 1
        }));
        if (!currentRules.some(r => r.symptomId === symptomId)) {
            currentRules.push({ symptomId, condition: 'equal', value: 1 });
            renderDiseaseRuleRows(currentRules);
        }
    });
    diseaseRulesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-rule-btn')) {
            const row = e.target.closest('[data-symptom-id]');
            row.remove();
            const currentRuleIds = Array.from(diseaseRulesContainer.querySelectorAll('[data-symptom-id]')).map(r => parseInt(r.dataset.symptomId));
            populateSymptomSelect(currentRuleIds);
        }
    });
    saveDiseaseBtn.addEventListener('click', () => {
        const name = diseaseNameInput.value.trim();
        const description = diseaseDescInput.value.trim();
        const id = editingDiseaseIdInput.value ? parseInt(editingDiseaseIdInput.value) : null;
        if (!name) return alert('Disease name is required.');
        const rules = Array.from(diseaseRulesContainer.querySelectorAll('[data-symptom-id]')).map(row => ({
            symptomId: parseInt(row.dataset.symptomId),
            condition: row.querySelector('.condition-select').value,
            value: parseInt(row.querySelector('.value-input').value) || 1
        }));
        if (id) {
            const disease = diseases.find(d => d.id === id);
            if (disease) { disease.name = name; disease.description = description; disease.rules = rules; }
        } else {
            diseases.push({ id: nextDiseaseId++, name, description, rules });
        }
        renderDiseasesTable();
        closeModal(diseaseModal);
    });

    // --- DIAGNOSIS TEST LOGIC ---
    newConsultationBtn.addEventListener('click', () => {
        tempSelectedSymptoms = [];
        renderConsultationSymptomSelection();
        openModal(consultationModal);
    });
    
    const renderConsultationSymptomSelection = () => {
        consultationModalTitle.textContent = 'Step 1: Select Symptoms';
        consultationModalBody.innerHTML = `
            <p class="mb-2 font-semibold">Please select all symptoms you are experiencing.</p>
            <div class="searchable-dropdown">
                <input type="text" id="symptom-search-input" class="form-input" placeholder="Search for a symptom...">
                <div id="symptom-search-list" class="searchable-dropdown-list"></div>
            </div>
            <div id="selected-symptoms-container" class="selected-symptoms-container mt-2">
                <p class="text-gray-500">No symptoms selected.</p>
            </div>
        `;
        consultationModalFooter.innerHTML = `<button id="next-step-btn" class="btn btn-primary">Next</button>`;
        
        const searchInput = consultationModalBody.querySelector('#symptom-search-input');
        const searchList = consultationModalBody.querySelector('#symptom-search-list');
        
        searchInput.addEventListener('keyup', () => {
            const query = searchInput.value.toLowerCase();
            searchList.innerHTML = '';
            if (query) {
                const filtered = symptoms.filter(s => s.name.toLowerCase().includes(query) && !tempSelectedSymptoms.some(ts => ts.id === s.id));
                filtered.forEach(s => {
                    const item = document.createElement('div');
                    item.className = 'searchable-dropdown-item';
                    item.textContent = s.name;
                    item.dataset.id = s.id;
                    searchList.appendChild(item);
                });
                searchList.classList.toggle('visible', filtered.length > 0);
            } else {
                searchList.classList.remove('visible');
            }
        });

        searchList.addEventListener('click', (e) => {
            if (e.target.matches('.searchable-dropdown-item')) {
                const id = parseInt(e.target.dataset.id);
                const name = e.target.textContent;
                if (!tempSelectedSymptoms.some(s => s.id === id)) {
                    tempSelectedSymptoms.push({ id, name });
                    renderSelectedSymptomTags();
                }
                searchInput.value = '';
                searchList.classList.remove('visible');
            }
        });

        document.getElementById('next-step-btn').addEventListener('click', () => {
            if (tempSelectedSymptoms.length > 0) {
                renderConsultationDurationInput();
            } else {
                alert('Please select at least one symptom.');
            }
        });
    };

    const renderSelectedSymptomTags = () => {
        const container = document.getElementById('selected-symptoms-container');
        container.innerHTML = '';
        if (tempSelectedSymptoms.length === 0) {
            container.innerHTML = `<p class="text-gray-500">No symptoms selected.</p>`;
            return;
        }
        tempSelectedSymptoms.forEach(s => {
            const tag = document.createElement('div');
            tag.className = 'symptom-tag';
            tag.innerHTML = `<span>${s.name}</span><button data-id="${s.id}">&times;</button>`;
            tag.querySelector('button').addEventListener('click', (e) => {
                const idToRemove = parseInt(e.target.dataset.id);
                tempSelectedSymptoms = tempSelectedSymptoms.filter(ts => ts.id !== idToRemove);
                renderSelectedSymptomTags();
            });
            container.appendChild(tag);
        });
    };

    const renderConsultationDurationInput = () => {
        consultationModalTitle.textContent = 'Step 2: Specify Duration';
        consultationModalBody.innerHTML = `<p class="mb-2 font-semibold">For how many days have you experienced each symptom?</p>`;
        const form = document.createElement('div');
        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.gap = '1rem';
        tempSelectedSymptoms.forEach(s => {
            form.innerHTML += `
                <div class="flex items-center justify-between">
                    <label class="font-semibold">${s.name}</label>
                    <input type="number" min="1" value="1" class="form-input symptom-duration-input" style="width: 8rem;" data-symptom-id="${s.id}">
                </div>
            `;
        });
        consultationModalBody.appendChild(form);
        consultationModalFooter.innerHTML = `<button id="run-diagnosis-btn" class="btn btn-primary">Run Diagnosis</button>`;
        
        document.getElementById('run-diagnosis-btn').addEventListener('click', runDiagnosis);
    };

    const runDiagnosis = () => {
        showLoader();
        const patientSymptoms = Array.from(consultationModalBody.querySelectorAll('.symptom-duration-input')).map(input => ({
            symptomId: parseInt(input.dataset.symptomId),
            duration: parseInt(input.value)
        }));

        let matchedDiseases = [];
        diseases.forEach(disease => {
            const allRulesMet = disease.rules.every(rule => {
                const patientSymptom = patientSymptoms.find(ps => ps.symptomId === rule.symptomId);
                if (!patientSymptom) return false;
                switch (rule.condition) {
                    case 'more_than': return patientSymptom.duration > rule.value;
                    case 'less_than': return patientSymptom.duration < rule.value;
                    case 'equal': return patientSymptom.duration >= rule.value;
                    default: return false;
                }
            });
            if (allRulesMet) matchedDiseases.push(disease);
        });

        const result = matchedDiseases.length > 0 ? matchedDiseases[0].name : 'No specific diagnosis found.';
        diagnosisHistory.unshift({ 
            date: new Date().toLocaleString(), 
            symptoms: patientSymptoms.map(ps => `${getSymptomName(ps.symptomId)} (${ps.duration} days)`), 
            result 
        });
        
        setTimeout(() => {
            hideLoader();
            renderConsultationResult(result);
            renderDiagnosisHistory();
        }, 1500);
    };

    const renderConsultationResult = (result) => {
        consultationModalTitle.textContent = 'Diagnosis Result';
        consultationModalBody.innerHTML = `
            <div class="text-center">
                <h4 class="text-xl font-semibold mb-2">Potential Diagnosis:</h4>
                <p class="text-2xl font-semibold" style="color: var(--primary-color);">${result}</p>
                <p class="text-sm text-gray-500 mt-4">Disclaimer: This is a prototype and not for actual medical use. Please consult a professional.</p>
            </div>
        `;
        consultationModalFooter.innerHTML = `<button id="finish-consultation-btn" class="btn btn-primary">Finish</button>`;
        document.getElementById('finish-consultation-btn').addEventListener('click', () => closeModal(consultationModal));
    };

    const renderDiagnosisHistory = () => {
        historyTableBody.innerHTML = '';
        if (diagnosisHistory.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No consultations yet.</td></tr>`;
        } else {
            diagnosisHistory.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${entry.date}</td>
                    <td style="white-space: normal;">${entry.symptoms.join(', ')}</td>
                    <td>${entry.result}</td>
                `;
                historyTableBody.appendChild(row);
            });
        }
    };
    
    // --- INITIALIZATION ---
    const init = () => {
        handleNavigation(window.location.hash);
    };

    init();
});