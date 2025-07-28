document.addEventListener('DOMContentLoaded', () => {
    // --- SIMULATE INITIAL LOADING ---
    const appContainer = document.getElementById('app-container');
    setTimeout(() => {
        appContainer.style.visibility = 'visible';
        appContainer.classList.add('loaded');
    }, 500);

    // --- STATE MANAGEMENT ---
    let questionGroups = ['General Symptoms', 'Skin Issues', 'Digestive Issues'];
    let rules = [
        { id: 1, questionGroup: 'General Symptoms', type: 'checkbox', conditions: ['fever', 'cough', 'sore throat'], diagnosis: 'Common Cold', nextQuestionId: null },
        { id: 2, questionGroup: 'General Symptoms', type: 'checkbox', conditions: ['fever', 'headache', 'body aches'], diagnosis: 'Influenza (Flu)', nextQuestionId: 6 },
        { id: 3, questionGroup: 'Skin Issues', type: 'checkbox', conditions: ['rash', 'itchiness'], diagnosis: 'Allergic Reaction', nextQuestionId: null },
        { id: 4, questionGroup: 'Are you experiencing fatigue?', type: 'yes_no', conditions: ['yes'], diagnosis: 'Possible Fatigue Syndrome', nextQuestionId: null },
        { id: 5, questionGroup: 'General Symptoms', type: 'checkbox', conditions: ['fever', 'rash', 'fatigue'], diagnosis: 'Viral Infection', nextQuestionId: null },
        { id: 6, questionGroup: 'Do you have difficulty breathing?', type: 'yes_no', conditions: ['yes'], diagnosis: 'Seek Emergency Care', nextQuestionId: null },
        { id: 7, questionGroup: 'Digestive Issues', type: 'checkbox', conditions: ['nausea', 'vomiting'], diagnosis: 'Gastroenteritis', nextQuestionId: null }
    ];
    let diagnosisHistory = [];
    let nextRuleId = 8;
    let currentPage = 1;
    const rowsPerPage = 5;

    // --- UI ELEMENTS ---
    const loader = document.getElementById('loader');
    const navLinks = document.querySelectorAll('.sidebar-link');
    const pages = document.querySelectorAll('.page-content');
    const rulesTableBody = document.getElementById('rules-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const createRuleBtn = document.getElementById('create-rule-btn');
    const ruleModal = document.getElementById('rule-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const editingRuleIdInput = document.getElementById('editing-rule-id');

    // Modal Form Elements
    const questionGroupSelect = ruleModal.querySelector('#question-group-select');
    const questionTypeSelect = ruleModal.querySelector('#question-type');
    const conditionsSection = ruleModal.querySelector('#conditions-section');
    const conditionsContainer = ruleModal.querySelector('#conditions-container');
    const addConditionBtn = ruleModal.querySelector('#add-condition-btn');
    const diagnosisInput = ruleModal.querySelector('#diagnosis-input');
    const nextQuestionSelect = ruleModal.querySelector('#next-question-select');
    const saveRuleBtn = ruleModal.querySelector('#save-rule-btn');

    // Diagnosis Test Elements
    const consultationListView = document.getElementById('consultation-list-view');
    const consultationFormView = document.getElementById('consultation-form-view');
    const newConsultationBtn = document.getElementById('new-consultation-btn');
    const backToHistoryBtn = document.getElementById('back-to-history-btn');
    const diagnosisQuestionsContainer = document.getElementById('diagnosis-questions-container');
    const runDiagnosisBtn = document.getElementById('run-diagnosis-btn');
    const historyTableBody = document.getElementById('history-table-body');

    // Settings Elements
    const newGroupNameInput = document.getElementById('new-group-name-input');
    const addGroupBtn = document.getElementById('add-group-btn');
    const questionGroupsList = document.getElementById('question-groups-list');


    // --- HELPER FUNCTIONS ---
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    // --- NAVIGATION ---
    const handleNavigation = (hash) => {
        const targetId = hash.substring(1) || 'dashboard';
        navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${targetId}`));
        pages.forEach(page => page.classList.toggle('active', page.id === targetId));
        if (targetId === 'rules') {
            renderRulesTable();
        } else if (targetId === 'test') {
            renderDiagnosisHistory();
            consultationListView.classList.add('active');
            consultationFormView.classList.remove('active');
        } else if (targetId === 'settings') {
            renderQuestionGroups();
        }
    };
    window.addEventListener('hashchange', () => handleNavigation(window.location.hash));
    document.getElementById('sidebar-nav').addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) { e.preventDefault(); window.location.hash = link.getAttribute('href'); }
    });

    // --- MODAL HANDLING ---
    const openRuleModal = (ruleId = null) => {
        resetRuleForm();
        populateQuestionGroupSelect();
        populateNextQuestionSelect();

        if (ruleId) {
            const rule = rules.find(r => r.id === ruleId);
            if (rule) {
                modalTitle.textContent = 'Edit Rule';
                editingRuleIdInput.value = rule.id;
                questionGroupSelect.value = rule.questionGroup;
                questionTypeSelect.value = rule.type;
                diagnosisInput.value = rule.diagnosis;
                nextQuestionSelect.value = rule.nextQuestionId || '';

                updateConditionsUI(rule.type);
                if (rule.type === 'checkbox') {
                    conditionsContainer.innerHTML = '';
                    rule.conditions.forEach(cond => addConditionInput(cond));
                }
            }
        } else {
            modalTitle.textContent = 'Create New Rule';
        }
        ruleModal.classList.add('visible');
    };
    const closeRuleModal = () => ruleModal.classList.remove('visible');
    createRuleBtn.addEventListener('click', () => openRuleModal());
    modalCloseBtn.addEventListener('click', closeRuleModal);

    // --- RULE MANAGEMENT ---
    const renderRulesTable = () => {
        rulesTableBody.innerHTML = '';
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedRules = rules.slice(start, end);

        if (rules.length === 0) {
            rulesTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-4">No rules defined.</td></tr>`;
        } else {
            paginatedRules.forEach(rule => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td>${rule.questionGroup}</td>
                            <td><span class="tag ${rule.type === 'yes_no' ? 'tag-success' : ''}">${rule.type.replace('_', ' ')}</span></td>
                            <td>${rule.conditions.map(c => `<span class="tag">${c}</span>`).join(' ')}</td>
                            <td>${rule.diagnosis}</td>
                            <td class="flex gap-2">
                                <button class="btn-warning !p-2 !rounded-full edit-rule-btn" data-id="${rule.id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                                </button>
                                <button class="btn-danger !p-2 !rounded-full delete-rule-btn" data-id="${rule.id}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </td>
                        `;
                rulesTableBody.appendChild(row);
            });
        }
        renderPagination();
    };

    const renderPagination = () => {
        paginationControls.innerHTML = '';
        const pageCount = Math.ceil(rules.length / rowsPerPage);
        if (pageCount <= 1) return;
        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.toggle('active', i === currentPage);
            btn.addEventListener('click', () => { currentPage = i; renderRulesTable(); });
            paginationControls.appendChild(btn);
        }
    };

    rulesTableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-rule-btn');
        const editBtn = e.target.closest('.edit-rule-btn');
        if (deleteBtn) {
            const ruleId = parseInt(deleteBtn.dataset.id);
            rules = rules.filter(rule => rule.id !== ruleId);
            if ((currentPage - 1) * rowsPerPage >= rules.length && currentPage > 1) { currentPage--; }
            renderRulesTable();
        }
        if (editBtn) {
            const ruleId = parseInt(editBtn.dataset.id);
            openRuleModal(ruleId);
        }
    });

    // --- RULE CREATION/EDIT LOGIC ---
    const updateConditionsUI = (type) => {
        conditionsContainer.innerHTML = '';
        if (type === 'checkbox') {
            conditionsSection.style.display = 'block';
            addConditionInput();
        } else if (type === 'yes_no') {
            conditionsSection.style.display = 'none';
        }
    };
    questionTypeSelect.addEventListener('change', (e) => updateConditionsUI(e.target.value));

    const addConditionInput = (value = '') => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2';
        div.innerHTML = `
                    <input type="text" class="form-input flex-grow condition-input" placeholder="e.g., fever" value="${value}">
                    <button class="text-red-500 hover:text-red-700 font-bold text-2xl remove-condition-btn">&times;</button>
                `;
        conditionsContainer.appendChild(div);
        div.querySelector('.remove-condition-btn').addEventListener('click', () => div.remove());
    };
    addConditionBtn.addEventListener('click', () => addConditionInput());

    const resetRuleForm = () => {
        editingRuleIdInput.value = '';
        questionGroupSelect.value = '';
        questionTypeSelect.value = 'checkbox';
        diagnosisInput.value = '';
        nextQuestionSelect.value = '';
        updateConditionsUI('checkbox');
    };

    const populateQuestionGroupSelect = () => {
        questionGroupSelect.innerHTML = questionGroups.map(g => `<option value="${g}">${g}</option>`).join('');
    }

    const populateNextQuestionSelect = () => {
        const uniqueQuestions = [...new Map(rules.map(rule => [rule.questionGroup, rule])).values()];
        nextQuestionSelect.innerHTML = '<option value="">None</option>';
        nextQuestionSelect.innerHTML += uniqueQuestions.map(q => `<option value="${q.id}">${q.questionGroup}</option>`).join('');
    }

    saveRuleBtn.addEventListener('click', () => {
        const type = questionTypeSelect.value;
        const questionGroup = questionGroupSelect.value;
        const diagnosis = diagnosisInput.value.trim();
        const nextId = nextQuestionSelect.value ? parseInt(nextQuestionSelect.value) : null;
        let conditions = [];

        if (type === 'checkbox') {
            conditions = [...conditionsContainer.querySelectorAll('.condition-input')]
                .map(input => input.value.trim().toLowerCase()).filter(Boolean);
        } else {
            conditions = ['yes'];
        }

        if (!questionGroup || !diagnosis || (type === 'checkbox' && conditions.length === 0)) {
            alert('Please fill all required fields.');
            return;
        }

        showLoader();
        setTimeout(() => {
            const editingId = editingRuleIdInput.value ? parseInt(editingRuleIdInput.value) : null;
            if (editingId) {
                const ruleIndex = rules.findIndex(r => r.id === editingId);
                if (ruleIndex > -1) {
                    rules[ruleIndex] = { ...rules[ruleIndex], questionGroup, type, conditions, diagnosis, nextQuestionId: nextId };
                }
            } else {
                rules.push({ id: nextRuleId++, questionGroup, type, conditions, diagnosis, nextQuestionId: nextId });
                currentPage = Math.ceil(rules.length / rowsPerPage);
            }
            renderRulesTable();
            resetRuleForm();
            closeRuleModal();
            hideLoader();
        }, 1500);
    });

    // --- SETTINGS LOGIC ---
    const renderQuestionGroups = () => {
        questionGroupsList.innerHTML = '';
        questionGroups.forEach(group => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 bg-gray-100 rounded';
            div.innerHTML = `
                        <span>${group}</span>
                        <button class="text-red-500 hover:text-red-700 delete-group-btn" data-group="${group}">&times;</button>
                    `;
            questionGroupsList.appendChild(div);
        });
    };
    addGroupBtn.addEventListener('click', () => {
        const newGroup = newGroupNameInput.value.trim();
        if (newGroup && !questionGroups.includes(newGroup)) {
            questionGroups.push(newGroup);
            newGroupNameInput.value = '';
            renderQuestionGroups();
        }
    });
    questionGroupsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-group-btn')) {
            const groupToDelete = e.target.dataset.group;
            questionGroups = questionGroups.filter(g => g !== groupToDelete);
            renderQuestionGroups();
        }
    });

    // --- DIAGNOSIS TEST LOGIC ---
    newConsultationBtn.addEventListener('click', () => {
        consultationListView.classList.remove('active');
        consultationFormView.classList.add('active');
        renderDiagnosisQuestions();
    });
    backToHistoryBtn.addEventListener('click', () => {
        consultationListView.classList.add('active');
        consultationFormView.classList.remove('active');
    });

    const renderDiagnosisQuestions = (questionId = null) => {
        if (!questionId) {
            diagnosisQuestionsContainer.innerHTML = '';
        }

        let questionsToRender;
        if (questionId) {
            const rule = rules.find(r => r.id === questionId);
            questionsToRender = rule ? [rule] : [];
        } else {
            const allNextIds = new Set(rules.map(r => r.nextQuestionId).filter(Boolean));
            questionsToRender = rules.filter(rule => !allNextIds.has(rule.id));
        }

        const uniqueQuestions = [...new Map(questionsToRender.map(q => [q.questionGroup, q])).values()];

        if (uniqueQuestions.length === 0 && !questionId) {
            diagnosisQuestionsContainer.innerHTML = `<p class="text-gray-500">No starting questions found. Configure rules in the Rule Management section.</p>`;
            return;
        }

        uniqueQuestions.forEach(rule => {
            if (diagnosisQuestionsContainer.querySelector(`[data-question-id="${rule.id}"]`)) return;

            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block border-t pt-4 mt-4';
            questionBlock.dataset.questionId = rule.id;

            if (rule.type === 'yes_no') {
                questionBlock.innerHTML = `
                            <label class="font-semibold text-gray-700">${rule.questionGroup}</label>
                            <div class="mt-2 flex space-x-4">
                                <label class="flex items-center"><input type="radio" name="q_${rule.id}" value="yes" data-next-id="${rule.nextQuestionId || ''}" class="mr-2">${'Yes'}</label>
                                <label class="flex items-center"><input type="radio" name="q_${rule.id}" value="no" class="mr-2" checked>${'No'}</label>
                            </div>
                        `;
            } else { // checkbox
                const relatedSymptoms = rules.filter(r => r.questionGroup === rule.questionGroup).flatMap(r => r.conditions);
                const uniqueSymptoms = [...new Set(relatedSymptoms)];
                questionBlock.innerHTML = `
                            <label class="font-semibold text-gray-700">${rule.questionGroup}</label>
                            <div class="mt-2 grid grid-cols-2 gap-2">
                                ${uniqueSymptoms.map(symptom => `
                                    <label class="flex items-center">
                                        <input type="checkbox" value="${symptom}" class="mr-2">
                                        <span class="capitalize">${symptom}</span>
                                    </label>
                                `).join('')}
                            </div>
                        `;
            }
            diagnosisQuestionsContainer.appendChild(questionBlock);
        });
    };

    diagnosisQuestionsContainer.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.value === 'yes') {
            const nextId = e.target.dataset.nextId ? parseInt(e.target.dataset.nextId) : null;
            if (nextId) {
                renderDiagnosisQuestions(nextId);
            }
        }
    });

    runDiagnosisBtn.addEventListener('click', () => {
        const selectedSymptoms = [];
        diagnosisQuestionsContainer.querySelectorAll('input:checked').forEach(input => {
            if (input.type === 'checkbox') selectedSymptoms.push(input.value);
            if (input.type === 'radio' && input.value === 'yes') selectedSymptoms.push('yes');
        });

        let potentialDiagnoses = [];
        rules.forEach(rule => {
            const allConditionsMet = rule.conditions.every(condition => selectedSymptoms.includes(condition));
            if (allConditionsMet) {
                potentialDiagnoses.push({ diagnosis: rule.diagnosis, matchCount: rule.conditions.length });
            }
        });

        potentialDiagnoses.sort((a, b) => b.matchCount - a.matchCount);
        const finalDiagnoses = [...new Set(potentialDiagnoses.map(p => p.diagnosis))];

        if (finalDiagnoses.length > 0) {
            diagnosisHistory.unshift({ date: new Date().toLocaleString(), symptoms: selectedSymptoms, result: finalDiagnoses[0] });
        }

        backToHistoryBtn.click();
    });

    const renderDiagnosisHistory = () => {
        historyTableBody.innerHTML = '';
        if (diagnosisHistory.length === 0) {
            historyTableBody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No consultations yet.</td></tr>`;
        } else {
            diagnosisHistory.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${entry.date}</td><td>${entry.symptoms.map(s => `<span class="tag">${s}</span>`).join(' ')}</td><td>${entry.result}</td>`;
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