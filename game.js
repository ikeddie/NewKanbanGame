// --- DOM Elements (Declared as const here as they are accessed directly by objects) ---
// These are global DOM elements that all managers might need to interact with for rendering or event listening.
const backlogColumn = document.getElementById('backlog');
const prioritizedColumn = document.getElementById('prioritized');
const analyzedInProgressColumn = document.getElementById('analyzed-in-progress');
const analyzedDoneColumn = document.getElementById('analyzed-done');
const developedInProgressColumn = document.getElementById('developed-in-progress');
const developedDoneColumn = document.getElementById('developed-done');
const testingColumn = document.getElementById('testing');
const deployedColumn = document.getElementById('deployed');
const dayCounterDisplay = document.getElementById('dayCounterDisplay');
const profitDisplay = document.getElementById('profitDisplay');
const completeRoundButton = document.getElementById('completeRoundButton');
const waitingResourcesContainer = document.getElementById('waitingResources');
const testModeButton = document.getElementById('testModeButton'); // New: Test Mode button

// --- Helper Functions ---
// Utility function, kept global as it's a pure function and generally useful.
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- STORY MANAGER OBJECT ---
// Manages all game data related to user stories and their rendering.
const StoryManager = {
    allStoriesData: [], // Stores all predefined stories, regardless of their current status (hidden/active).
    activeStories: [], // Stores stories that are currently on the Kanban board.
    nextStoryId: 1, // Used for assigning unique IDs if dynamic story generation were added.

    // Store original effort values for calculating progress (X/Y pts).
    originalEfforts: {}, // { storyId: { analysis: X, dev: Y, test: Z } }

    /**
     * Initializes the StoryManager by generating all stories and populating the initial backlog.
     */
    init: function() {
        this.generateAllStories();
        // Populate initial visible backlog (first 5 stories)
        for (let i = 0; i < Math.min(5, this.allStoriesData.length); i++) {
            this.allStoriesData[i].status = 'backlog'; // Set status to make them visible.
            this.activeStories.push(this.allStoriesData[i]); // Add to the active stories array.
        }
        console.log("StoryManager initialized. Initial active stories:", this.activeStories.length);
    },

    /**
     * Generates all 20 predefined user stories with their initial effort points and price.
     * Also stores original effort values.
     */
    generateAllStories: function() {
        const predefinedStoriesData = [
            { id: 1, description: "User Login & Registration", price: 150, analysisEffort: 8, devEffort: 18, testEffort: 10 },
            { id: 2, description: "Product Catalog Search", price: 120, analysisEffort: 6, devEffort: 15, testEffort: 8 },
            { id: 3, description: "Shopping Cart Functionality", price: 180, analysisEffort: 10, devEffort: 20, testEffort: 12 },
            { id: 4, description: "Payment Gateway Integration", price: 200, analysisEffort: 12, devEffort: 25, testEffort: 15 },
            { id: 5, description: "User Profile Management", price: 100, analysisEffort: 5, devEffort: 12, testEffort: 7 },
            { id: 6, description: "Order History View", price: 90, analysisEffort: 4, devEffort: 10, testEffort: 6 },
            { id: 7, description: "Admin Product Management", price: 160, analysisEffort: 9, devEffort: 19, testEffort: 11 },
            { id: 8, description: "Forgot Password Flow", price: 70, analysisEffort: 3, devEffort: 8, testEffort: 5 },
            { id: 9, description: "Email Notification System", price: 110, analysisEffort: 6, devEffort: 14, testEffort: 9 },
            { id: 10, description: "Customer Support Chatbot", price: 170, analysisEffort: 11, devEffort: 22, testEffort: 13 },
            { id: 11, description: "Product Reviews & Ratings", price: 130, analysisEffort: 7, devEffort: 16, testEffort: 9 },
            { id: 12, description: "Wishlist Feature", price: 80, analysisEffort: 4, devEffort: 9, testEffort: 5 },
            { id: 13, description: "API for Mobile App", price: 190, analysisEffort: 10, devEffort: 23, testEffort: 14 },
            { id: 14, description: "Search Engine Optimization (SEO)", price: 60, analysisEffort: 3, devEffort: 7, testEffort: 4 },
            { id: 15, description: "Data Analytics Dashboard", price: 220, analysisEffort: 15, devEffort: 28, testEffort: 18 },
            { id: 16, description: "GDPR Compliance", price: 140, analysisEffort: 8, devEffort: 17, testEffort: 10 },
            { id: 17, description: "Multi-language Support", price: 160, analysisEffort: 9, devEffort: 20, testEffort: 11 },
            { id: 18, description: "Guest Checkout", price: 95, analysisEffort: 5, devEffort: 11, testEffort: 6 },
            { id: 19, description: "Referral Program", price: 125, analysisEffort: 7, devEffort: 16, testEffort: 9 },
            { id: 20, description: "Server Performance Optimization", price: 175, analysisEffort: 10, devEffort: 24, testEffort: 15 }
        ];

        this.allStoriesData = predefinedStoriesData.map(data => {
            // Store original effort values for each story
            this.originalEfforts[data.id] = {
                analysis: data.analysisEffort,
                dev: data.devEffort,
                test: data.testEffort
            };
            return {
                ...data,
                status: 'hidden-backlog', // All stories initially start as hidden from the board.
                allocatedResources: [], // Array to hold resources currently assigned to this story.
                daysInPrioritized: 0 // Counter for how many days a story has been in 'prioritized' column.
            };
        });
        console.log("All stories generated:", this.allStoriesData.length);
    },

    /**
     * Replenishes the backlog with new stories from the `allStoriesData` pool if the backlog is below a threshold.
     */
    replenishBacklog: function() {
        const currentBacklogCount = this.activeStories.filter(s => s.status === 'backlog').length;
        const storiesNeeded = 5 - currentBacklogCount; // Aim for 5 stories in backlog.
        console.log(`Replenish backlog: Current backlog count: ${currentBacklogCount}, Stories needed: ${storiesNeeded}`);

        if (storiesNeeded > 0) {
            // Find stories that are still hidden and not yet on the board.
            const hiddenStories = this.allStoriesData.filter(s => s.status === 'hidden-backlog');
            let addedCount = 0;
            for (let i = 0; i < storiesNeeded && i < hiddenStories.length; i++) {
                const storyToReveal = hiddenStories[i];
                storyToReveal.status = 'backlog'; // Change status to make it visible in the backlog.
                this.activeStories.push(storyToReveal); // Add to the active user stories array.
                addedCount++;
            }
            console.log(`Replenished backlog with ${addedCount} new stories.`);
        }
    },

    /**
     * Gets a story object by its ID from the active stories list.
     * @param {number} id - The ID of the story to find.
     * @returns {object|undefined} The story object or undefined if not found.
     */
    getStoryById: function(id) {
        return this.activeStories.find(story => story.id === id);
    },

    /**
     * Gets all stories that are currently in the 'deployed' column.
     * @returns {Array<object>} An array of deployed story objects.
     */
    getDeployedStories: function() {
        return this.activeStories.filter(story => story.status === 'deployed');
    },

    /**
     * Renders all user stories (activeStories) onto their respective Kanban columns.
     * This function dynamically creates/updates the HTML elements for each story.
     */
    renderAllStories: function() {
        console.log("--- Starting renderAllStories ---");
        console.log("Active stories count BEFORE rendering:", this.activeStories.length);

        // Clear existing cards from all columns to prevent duplicates before re-rendering.
        const allColumns = [
            backlogColumn, prioritizedColumn, analyzedInProgressColumn, analyzedDoneColumn,
            developedInProgressColumn, developedDoneColumn, testingColumn, deployedColumn
        ];
        allColumns.forEach(column => {
            column.querySelectorAll('.kanban-card').forEach(card => card.remove());
            // Clear existing WIP indicators (if they exist)
            const wipCountSpan = column.querySelector('.wip-count');
            if (wipCountSpan) wipCountSpan.textContent = '';
        });

        // Object to hold current WIP counts for each relevant column
        const currentWipCounts = {
            'prioritized': 0,
            'analyzed-in-progress': 0,
            'analyzed-done': 0,
            'developed-in-progress': 0,
            'developed-done': 0,
            'testing': 0
        };

        // Iterate through user stories currently on the board and append them to the correct column.
        this.activeStories.forEach(story => {
            console.log(`Attempting to render Story ID: ${story.id}, Status: ${story.status}`);
            const card = document.createElement('div');
            card.classList.add('kanban-card');
            card.setAttribute('draggable', true); // Make cards draggable for column transitions.
            card.dataset.id = story.id; // Store story ID as a data attribute.

            // Add specific visual classes based on story status for "look and feel" changes.
            if (story.status === 'prioritized') {
                if (story.daysInPrioritized >= 1) { // Story has spent at least 1 full day.
                    card.classList.add('prioritized-ready'); // Green border if ready to move.
                } else {
                    card.classList.add('prioritized-not-ready'); // Red border if not yet ready.
                }
                currentWipCounts['prioritized']++;
            } else if (story.status === 'analyzed-in-progress') {
                currentWipCounts['analyzed-in-progress']++;
            } else if (story.status === 'analyzed-done') {
                currentWipCounts['analyzed-done']++;
            } else if (story.status === 'developed-in-progress') {
                currentWipCounts['developed-in-progress']++;
            } else if (story.status === 'developed-done') {
                currentWipCounts['developed-done']++;
            } else if (story.status === 'testing') {
                currentWipCounts['testing']++;
            } else if (story.status === 'deployed') {
                card.classList.add('deployed-story'); // Special class for deployed stories (e.g., hides effort).
            }

            // Create and append story description.
            const descriptionElement = document.createElement('div');
            descriptionElement.classList.add('story-description');
            descriptionElement.textContent = story.description; // Changed to just description
            card.appendChild(descriptionElement);

            // --- Price Tag Styling ---
            const priceTag = document.createElement('span');
            priceTag.classList.add('story-price-tag');
            priceTag.textContent = `$${story.price}`;
            card.appendChild(priceTag); // Append to card, CSS will position it

            // Create and append story details (effort).
            const detailsElement = document.createElement('div');
            detailsElement.classList.add('story-details');
            let detailsHtml = ''; // Initialize empty

            // Only show effort details if the story is not yet deployed.
            if (story.status !== 'deployed') {
                const originalAnalysis = this.originalEfforts[story.id]?.analysis || 0;
                const originalDev = this.originalEfforts[story.id]?.dev || 0;
                const originalTest = this.originalEfforts[story.id]?.test || 0;

                let analysisEffortHtml = `Analysis: ${story.analysisEffort}/${originalAnalysis} pts`;
                let devEffortHtml = `Dev: ${story.devEffort}/${originalDev} pts`;
                let testEffortHtml = `Test: ${story.testEffort}/${originalTest} pts`;

                // Highlight current phase's effort visually.
                if (story.status === 'analyzed-in-progress') {
                    analysisEffortHtml = `<span class="effort-line highlight-effort">${analysisEffortHtml}</span>`;
                } else {
                    analysisEffortHtml = `<span class="effort-line">${analysisEffortHtml}</span>`;
                }

                if (story.status === 'developed-in-progress') {
                    devEffortHtml = `<span class="effort-line highlight-effort">${devEffortHtml}</span>`;
                } else {
                    devEffortHtml = `<span class="effort-line">${devEffortHtml}</span>`;
                }

                if (story.status === 'testing') {
                    testEffortHtml = `<span class="effort-line highlight-effort">${testEffortHtml}</span>`;
                } else {
                    testEffortHtml = `<span class="effort-line">${testEffortHtml}</span>`;
                }
                detailsHtml += `${analysisEffortHtml}<br>${devEffortHtml}<br>${testEffortHtml}`;
            }

            // Add daysInPrioritized for informational purposes on the card.
            if (story.status === 'prioritized') {
                detailsHtml += `<br><span class="days-in-prioritized">Days: ${story.daysInPrioritized}</span>`;
            }
            detailsElement.innerHTML = detailsHtml;
            card.appendChild(detailsElement);


            // Container for allocated resources within the card.
            const allocatedResourcesContainer = document.createElement('div');
            allocatedResourcesContainer.classList.add('allocated-resources-container');
            card.appendChild(allocatedResourcesContainer);

            // Append already allocated resources to this card.
            story.allocatedResources.forEach(res => {
                if (res.element) { // Check if the DOM element reference exists.
                    res.element.classList.add('allocated'); // Mark as allocated.
                    allocatedResourcesContainer.appendChild(res.element);
                }
            });

            // Add drag event listeners to the card for story drags (to move between columns).
            card.addEventListener('dragstart', DragAndDropManager.handleStoryDragStart);

            // Attach drag and drop event listeners to the card itself for resource drops.
            card.addEventListener('dragover', DragAndDropManager.handleCardDragOver);
            card.addEventListener('dragleave', DragAndDropManager.handleCardDragLeave);
            card.addEventListener('drop', DragAndDropManager.handleCardDrop);

            // Append the created card to the correct column based on its current status.
            switch (story.status) {
                case 'backlog':
                    backlogColumn.appendChild(card);
                    break;
                case 'prioritized':
                    prioritizedColumn.appendChild(card);
                    break;
                case 'analyzed-in-progress':
                    analyzedInProgressColumn.appendChild(card);
                    break;
                case 'analyzed-done':
                    analyzedDoneColumn.appendChild(card);
                    break;
                case 'developed-in-progress':
                    developedInProgressColumn.appendChild(card);
                    break;
                case 'developed-done':
                    developedDoneColumn.appendChild(card);
                    break;
                case 'testing':
                    testingColumn.appendChild(card);
                    break;
                case 'deployed':
                    deployedColumn.appendChild(card);
                    break;
                default:
                    console.warn(`Story ID ${story.id} has unhandled status: ${story.status}. Not rendering.`);
                    break;
            }
        });

        // --- Update WIP Limit Indicators ---
        // These updates assume corresponding <span class="wip-count" data-limit="X"></span> elements exist in index.html
        document.querySelectorAll('.column-header .wip-count').forEach(wipSpan => {
            const columnId = wipSpan.closest('.kanban-column').id;
            const limit = parseInt(wipSpan.dataset.limit || 0); // Get limit from data attribute
            let currentCount = 0;

            // The WIP limits are defined in DragAndDropManager.handleColumnDrop for logic.
            // Here, we just display the count based on what's currently rendered.
            // For combined limits (Analysis/Development), we show the actual items in the 'in-progress' state.
            if (columnId === 'prioritized') {
                currentCount = currentWipCounts['prioritized'];
                wipSpan.textContent = `${currentCount}/${limit}`;
            } else if (columnId === 'analyzed-in-progress') {
                // Display count of items actually in 'analyzed-in-progress' against the combined analysis limit
                currentCount = currentWipCounts['analyzed-in-progress'];
                wipSpan.textContent = `${currentCount}/${limit}`;
            } else if (columnId === 'developed-in-progress') {
                // Display count of items actually in 'developed-in-progress' against the combined development limit
                currentCount = currentWipCounts['developed-in-progress'];
                wipSpan.textContent = `${currentCount}/${limit}`;
            } else {
                // For columns without an explicit WIP limit display, hide the span or leave empty
                wipSpan.textContent = '';
                wipSpan.style.display = 'none'; // Ensure it's hidden if no count is to be shown
            }

            // For testing column, we just display current count against its limit
            if (columnId === 'testing') {
                currentCount = currentWipCounts['testing'];
                wipSpan.textContent = `${currentCount}/${limit}`;
            }


            // Add 'over-limit' class if current count exceeds the limit (only for in-progress columns that have limits)
            // Note: For combined WIP limits (analysis/development), this visual indicator only applies to the in-progress column.
            // The actual validation for exceeding combined limits happens in DragAndDropManager.handleColumnDrop
            if (limit > 0 && currentCount > limit) {
                wipSpan.classList.add('over-limit');
            } else {
                wipSpan.classList.remove('over-limit');
            }
        });

        // Update available resource count display
        const availableResourceCountSpan = document.getElementById('availableResourceCount');
        if (availableResourceCountSpan) {
            availableResourceCountSpan.textContent = this.resourceManager.availableResources.length;
        }
        console.log("--- Finished renderAllStories ---");
    }
};

// --- RESOURCE MANAGER OBJECT ---
// Manages all game data related to resources (analysts, developers, testers) and their rendering.
const ResourceManager = {
    availableResources: [], // Stores resource objects that are currently unassigned and in the waiting area.
    nextResourceId: 1, // Used for assigning unique IDs to new resources.
    initialCount: 3, // Initial number of each type of resource.

    /**
     * Initializes the ResourceManager by creating the initial set of resources.
     */
    init: function() {
        ['analyst', 'developer', 'tester'].forEach(type => {
            for (let i = 0; i < this.initialCount; i++) {
                this.availableResources.push({
                    id: `${type}_${this.nextResourceId++}`,
                    type: type,
                    element: null // Placeholder for the actual DOM element, set during rendering.
                });
            }
        });
    },

    /**
     * Renders all available resources in the waiting area (`waitingResourcesContainer`).
     * This function dynamically creates/updates the HTML elements for each resource.
     */
    renderAvailableResources: function() {
        waitingResourcesContainer.innerHTML = ''; // Clear current resources before re-rendering.

        this.availableResources.forEach(resource => {
            const resourceEl = document.createElement('div');
            resourceEl.classList.add('resource');
            resourceEl.setAttribute('draggable', true); // Make resources draggable.
            resourceEl.dataset.resourceId = resource.id; // Store resource ID as a data attribute.
            resourceEl.dataset.resourceType = resource.type; // Store resource type as a data attribute.

            // Determine the appropriate icon based on resource type.
            let iconClass = '';
            if (resource.type === 'analyst') {
                iconClass = 'fas fa-user-tie';
            } else if (resource.type === 'developer') {
                iconClass = 'fas fa-laptop-code';
            } else if (resource.type === 'tester') {
                iconClass = 'fas fa-bug';
            }
            resourceEl.innerHTML = `<i class="${iconClass}"></i> ${resource.type}`; // Added resource type text.

            // Attach dragstart listener.
            resourceEl.addEventListener('dragstart', DragAndDropManager.handleResourceDragStart);
            waitingResourcesContainer.appendChild(resourceEl);

            // Store a reference to the actual DOM element on the resource object itself.
            resource.element = resourceEl;
        });

        // Update the count of available resources in the header
        const availableResourceCountSpan = document.getElementById('availableResourceCount');
        if (availableResourceCountSpan) {
            availableResourceCountSpan.textContent = this.availableResources.length;
        }
    },

    /**
     * Gets a resource object by its ID from the available resources list.
     * @param {string} id - The ID of the resource to find.
     * @returns {object|undefined} The resource object or undefined if not found.
     */
    getResourceById: function(id) {
        return this.availableResources.find(res => res.id === id);
    },

    /**
     * Removes a resource from the available pool (when it's allocated to a story).
     * @param {string} id - The ID of the resource to remove.
     */
    removeResource: function(id) {
        this.availableResources = this.availableResources.filter(res => res.id !== id);
    },

    /**
     * Adds a resource back to the available pool (when it's deallocated from a story).
     * Ensures no duplicates are added.
     * @param {object} resource - The resource object to add.
     */
    addResource: function(resource) {
        if (!this.availableResources.some(res => res.id === resource.id)) {
            this.availableResources.push(resource);
        }
    }
};

// --- DRAG AND DROP MANAGER OBJECT ---
// Handles all drag-and-drop interactions for both stories and resources.
const DragAndDropManager = {
    draggedStoryCard: null, // Stores reference to the DOM element of the story card being dragged.
    draggedResourceElement: null, // Stores reference to the DOM element of the resource being dragged.
    originalResourceParentStory: null, // Stores the story object a resource came from, if any.
    storyManager: null, // Dependency injected StoryManager instance.
    resourceManager: null, // Dependency injected ResourceManager instance.

    /**
     * Initializes the DragAndDropManager by setting up dependencies and event listeners.
     * @param {object} storyMgr - Reference to the StoryManager.
     * @param {object} resourceMgr - Reference to the ResourceManager.
     */
    init: function(storyMgr, resourceMgr) {
        // Log the passed managers to ensure they are correct objects
        console.log("DragAndDropManager.init: storyMgr received:", storyMgr);
        console.log("DragAndDropManager.init: resourceMgr received:", resourceMgr);

        this.storyManager = storyMgr;
        this.resourceManager = resourceMgr;
        console.log("DragAndDropManager.init: 'this.storyManager' after assignment:", this.storyManager);
        console.log("DragAndDropManager.init: 'this.resourceManager' after assignment:", this.resourceManager);


        // Attach drag and drop event listeners to all Kanban columns for story drops.
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            // Using direct references to arrow functions defined on the object itself.
            column.addEventListener('dragover', this.handleColumnDragOver);
            column.addEventListener('dragleave', this.handleColumnDragLeave);
            column.addEventListener('drop', this.handleColumnDrop);
        });

        // Attach drag and drop event listeners for the resource waiting area.
        waitingResourcesContainer.addEventListener('dragover', this.handleWaitingAreaDragOver);
        waitingResourcesContainer.addEventListener('dragleave', this.handleWaitingAreaDragLeave);
        waitingResourcesContainer.addEventListener('drop', this.handleWaitingAreaDrop);

        // Global dragend listener to handle cleanup for both story and resource drags.
        // This single handler replaces handleStoryDragEnd and handleResourceDragEnd
        document.addEventListener('dragend', this.handleGlobalDragEnd);
    },

    // --- Story Drag & Drop Handlers (Refactored to Arrow Functions for consistent 'this' binding) ---
    /**
     * Handles the start of dragging a story card.
     * @param {Event} e - The dragstart event.
     */
    handleStoryDragStart: (e) => {
        // e.currentTarget is the element on which the event listener was attached (the card).
        DragAndDropManager.draggedStoryCard = e.currentTarget;
        e.dataTransfer.setData('text/plain', e.currentTarget.dataset.id); // Store story ID.
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging'); // Add visual feedback class.
        console.log("handleStoryDragStart: Dragging story with ID:", e.currentTarget.dataset.id);
    },

    /**
     * Handles a dragged item (story or resource) being dragged over a column.
     * @param {Event} e - The dragover event.
     */
    handleColumnDragOver: (e) => { // Refactored to arrow function
        e.preventDefault(); // Essential to allow a drop.
        // Only provide visual feedback if it's a story being dragged (not a resource).
        if (!e.dataTransfer.types.includes('text/resource-id')) {
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('drag-over'); // Add visual highlight to target column.
        }
    },

    /**
     * Handles a dragged item leaving a column.
     * @param {Event} e - The dragleave event.
     */
    handleColumnDragLeave: (e) => { // Refactored to arrow function
        e.currentTarget.classList.remove('drag-over'); // Remove visual highlight.
    },

    /**
     * Handles a story card being dropped onto a Kanban column.
     * @param {Event} e - The drop event.
     */
    handleColumnDrop: (e) => { // Refactored to arrow function
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over'); // Remove visual highlight.

        // Ignore if a resource is being dropped here (it should be dropped on a card).
        if (e.dataTransfer.types.includes('text/resource-id')) {
            return;
        }

        const storyId = e.dataTransfer.getData('text/plain'); // Get the ID of the dragged story.
        const droppedColumnId = e.currentTarget.id; // Get the ID of the column where it was dropped.

        // Extensive logging to confirm 'this' context and manager properties
        console.log("--- Inside handleColumnDrop (Arrow Function) ---");
        console.log("  'this' context (should be DragAndDropManager):", DragAndDropManager);
        console.log("  'DragAndDropManager.storyManager':", DragAndDropManager.storyManager);
        console.log("  typeof DragAndDropManager.storyManager:", typeof DragAndDropManager.storyManager);
        console.log("  typeof DragAndDropManager.storyManager.getStoryById:", typeof DragAndDropManager.storyManager.getStoryById);
        console.log("  storyId received from dataTransfer:", storyId);


        // Crucial change: Use DragAndDropManager.storyManager directly to avoid 'this' context issues.
        const story = DragAndDropManager.storyManager.getStoryById(parseInt(storyId)); // Convert storyId to integer
        if (!story) {
            console.warn(`Story with ID ${storyId} not found in active stories. Drop cancelled.`);
            return;
        }

        const currentStatus = story.status;
        let isValidMove = false; // Flag to determine if the move is allowed.

        // --- TEST MODE OVERRIDE ---
        if (GameManager.isTestModeActive) {
            console.log("Test Mode: Bypassing movement restrictions for story ID:", storyId);
            story.status = droppedColumnId; // Allow any move.
            DragAndDropManager.storyManager.renderAllStories(); // Use direct reference
            DragAndDropManager.draggedStoryCard = null;
            return; // Exit function early.
        }

        // --- Normal Mode: Capacity Checks for Workflow Limits (WIP Limits) ---
        let allowDropBasedOnCapacity = true;
        // Current count calculation (using local variables that reflect current DOM state)
        const currentPrioritizedCount = prioritizedColumn.querySelectorAll('.kanban-card').length;
        const currentAnalysisInProgressCount = analyzedInProgressColumn.querySelectorAll('.kanban-card').length;
        const currentAnalysisDoneCount = analyzedDoneColumn.querySelectorAll('.kanban-card').length;
        const currentDevInProgressCount = developedInProgressColumn.querySelectorAll('.kanban-card').length;
        const currentDevDoneCount = developedDoneColumn.querySelectorAll('.kanban-card').length;
        const currentTestingCount = testingColumn.querySelectorAll('.kanban-card').length;

        // WIP Limits (from mockup or typical Kanban)
        const WIP_LIMITS = {
            'prioritized': 3,
            'analysis': 4, // Combined limit for analyzed-in-progress and analyzed-done
            'development': 3, // Combined limit for developed-in-progress and developed-done
            'testing': 3
        };

        if (droppedColumnId === 'prioritized') {
            if (currentPrioritizedCount >= WIP_LIMITS.prioritized && currentStatus !== 'prioritized') {
                allowDropBasedOnCapacity = false;
            }
        } else if (droppedColumnId === 'analyzed-in-progress' || droppedColumnId === 'analyzed-done') {
            const totalAnalysisCount = currentAnalysisInProgressCount + currentAnalysisDoneCount;
            if (totalAnalysisCount >= WIP_LIMITS.analysis && !(currentStatus.startsWith('analyzed-'))) { // Only block if moving from outside analysis
                allowDropBasedOnCapacity = false;
            }
        } else if (droppedColumnId === 'developed-in-progress' || droppedColumnId === 'developed-done') {
            const totalDevCount = currentDevInProgressCount + currentDevDoneCount;
            if (totalDevCount >= WIP_LIMITS.development && !(currentStatus.startsWith('developed-'))) { // Only block if moving from outside development
                allowDropBasedOnCapacity = false;
            }
        } else if (droppedColumnId === 'testing') {
            if (currentTestingCount >= WIP_LIMITS.testing && currentStatus !== 'testing') {
                allowDropBasedOnCapacity = false;
            }
        } else if (droppedColumnId === 'deployed') {
            if (currentStatus !== 'testing' || story.testEffort > 0) {
                allowDropBasedOnCapacity = false;
            }
        }

        if (!allowDropBasedOnCapacity) {
            console.log(`Blocked move for Story ID: ${storyId} to ${droppedColumnId} due to WIP limit.`);
            return;
        }

        // --- Normal Mode: Valid Transition Checks (Kanban Rules) ---
        switch (currentStatus) {
            case 'backlog':
                if (droppedColumnId === 'prioritized') {
                    isValidMove = true;
                    story.daysInPrioritized = 0;
                }
                break;
            case 'prioritized':
                if (droppedColumnId === 'analyzed-in-progress' && story.daysInPrioritized >= 1) {
                    isValidMove = true;
                }
                break;
            case 'analyzed-done':
                if (droppedColumnId === 'developed-in-progress') {
                    isValidMove = true;
                }
                break;
            case 'developed-in-progress':
                if (droppedColumnId === 'developed-done' && story.devEffort === 0) {
                    isValidMove = true;
                }
                break;
            case 'developed-done':
                if (droppedColumnId === 'testing') {
                    isValidMove = true;
                }
                break;
            case 'analyzed-in-progress':
                if (droppedColumnId === 'analyzed-done' && story.analysisEffort === 0) {
                     isValidMove = true;
                }
                break;
            case 'testing':
                if (droppedColumnId === 'deployed' && story.testEffort === 0) {
                    isValidMove = true;
                }
                break;
        }

        if (isValidMove) {
            console.log(`Story ID: ${storyId} moving from ${currentStatus} to ${droppedColumnId}`);
            story.status = droppedColumnId;
            DragAndDropManager.storyManager.renderAllStories(); // Use direct reference
        } else {
            console.log(`Invalid move attempt for Story ID: ${storyId} from ${currentStatus} to ${droppedColumnId}`);
        }
        DragAndDropManager.draggedStoryCard = null;
    },

    /**
     * Handles the end of a story card drag operation (e.g., dropped or cancelled).
     * This logic is now part of handleGlobalDragEnd.
     */
    // handleStoryDragEnd: function(e) { ... },

    // --- Resource Drag & Drop Handlers (Refactored to Arrow Functions for consistent 'this' binding) ---
    /**
     * Handles the start of dragging a resource element.
     * @param {Event} e - The dragstart event.
     */
    handleResourceDragStart: (e) => { // Refactored to arrow function
        DragAndDropManager.draggedResourceElement = e.currentTarget;
        e.dataTransfer.setData('text/resource-id', e.currentTarget.dataset.resourceId); // Store resource ID.
        e.dataTransfer.setData('text/resource-type', e.currentTarget.dataset.resourceType); // Store resource type.
        e.dataTransfer.effectAllowed = 'move'; // Allow moving the resource.

        // Determine if the resource is coming from an already allocated story card.
        const parentCard = e.currentTarget.closest('.kanban-card');
        if (parentCard) {
            DragAndDropManager.originalResourceParentStory = DragAndDropManager.storyManager.getStoryById(parentCard.dataset.id);
            e.dataTransfer.setData('text/origin-story-id', parentCard.dataset.id);
        } else {
            DragAndDropManager.originalResourceParentStory = null;
            e.dataTransfer.setData('text/origin-story-id', 'none'); // Indicate it came from the waiting area.
        }
        e.currentTarget.classList.add('dragging-resource'); // Add visual feedback class.
    },

    /**
     * Handles a dragged item (resource) being dragged over a story card.
     * @param {Event} e - The dragover event.
     */
    handleCardDragOver: (e) => { // Refactored to arrow function
        // Only provide feedback if a resource is being dragged over a card.
        if (e.dataTransfer.types.includes('text/resource-id')) {
            e.preventDefault(); // Essential to allow a drop.
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('drag-over-resource'); // Highlight the target card.
        }
    },

    /**
     * Handles a dragged item (resource) leaving a story card.
     * @param {Event} e - The dragleave event.
     */
    handleCardDragLeave: (e) => { // Refactored to arrow function
        e.currentTarget.classList.remove('drag-over-resource'); // Remove highlight.
    },

    /**
     * Handles a resource being dropped onto a story card.
     * @param {Event} e - The drop event.
     */
    handleCardDrop: (e) => { // Refactored to arrow function
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over-resource'); // Remove highlight.

        if (!e.dataTransfer.types.includes('text/resource-id')) {
            return;
        }

        const resourceId = e.dataTransfer.getData('text/resource-id');
        const resourceType = e.dataTransfer.getData('text/resource-type');
        const targetStoryId = e.currentTarget.dataset.id; // ID of the card where resource was dropped.
        const originStoryId = e.dataTransfer.getData('text/origin-story-id');

        // Use DragAndDropManager.storyManager directly.
        const targetStory = DragAndDropManager.storyManager.getStoryById(parseInt(targetStoryId)); // Convert to integer
        if (!targetStory) return;

        // Use DragAndDropManager.resourceManager directly.
        let resourceToAllocate = DragAndDropManager.resourceManager.getResourceById(resourceId);
        let resourceWasOnStory = false;

        // If resource is not in available pool, it must be currently on another story.
        if (!resourceToAllocate) {
            const foundInStory = DragAndDropManager.storyManager.activeStories.find(s => s.allocatedResources.some(res => res.id === resourceId));
            if (foundInStory) {
                resourceToAllocate = foundInStory.allocatedResources.find(res => res.id === resourceId);
                resourceWasOnStory = true;
            }
        }

        if (!resourceToAllocate) return;

        // Check if the resource type matches the target story's current in-progress phase.
        let canAllocate = false;
        if (targetStory.status === 'analyzed-in-progress' && resourceType === 'analyst') {
            canAllocate = true;
        } else if (targetStory.status === 'developed-in-progress' && resourceType === 'developer') {
            canAllocate = true;
        } else if (targetStory.status === 'testing' && resourceType === 'tester') {
            canAllocate = true;
        }

        if (canAllocate) {
            console.log(`Allocating resource ${resourceId} to Story ID: ${targetStoryId}`);
            // Remove the resource from its previous location (either waiting area or another story).
            if (originStoryId !== 'none' && originStoryId !== targetStoryId) { // Moving from another story to this one.
                const oldStory = DragAndDropManager.storyManager.getStoryById(parseInt(originStoryId)); // Convert to integer
                if (oldStory) {
                    console.log(`Deallocating resource ${resourceId} from old Story ID: ${originStoryId}`);
                    oldStory.allocatedResources = oldStory.allocatedResources.filter(res => res.id !== resourceId);
                }
            } else if (!resourceWasOnStory) { // Coming from the waiting area.
                DragAndDropManager.resourceManager.removeResource(resourceId);
            }

            // Add the resource to the target story's allocated resources (if not already there).
            if (!targetStory.allocatedResources.some(res => res.id === resourceId)) {
                targetStory.allocatedResources.push(resourceToAllocate);
            }

            // Update visual state of the resource element.
            resourceToAllocate.element.classList.remove('dragging-resource');
            resourceToAllocate.element.classList.add('allocated');
            e.currentTarget.querySelector('.allocated-resources-container').appendChild(resourceToAllocate.element);

            // Re-render relevant parts of the UI to reflect changes.
            DragAndDropManager.resourceManager.renderAvailableResources(); // To update the waiting area.
            DragAndDropManager.storyManager.renderAllStories(); // To update all story cards.
        } else {
            console.log(`Cannot allocate resource ${resourceId} (${resourceType}) to Story ID: ${targetStoryId} (status: ${targetStory.status}). Type mismatch or invalid status.`);
        }
    },

    /**
     * Handles a resource being dragged over the waiting area container.
     * @param {Event} e - The dragover event.
     */
    handleWaitingAreaDragOver: (e) => { // Refactored to arrow function
        if (e.dataTransfer.types.includes('text/resource-id')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('drag-over'); // Highlight the waiting area.
        }
    },

    /**
     * Handles a resource leaving the waiting area container.
     * @param {Event} e - The dragleave event.
     */
    handleWaitingAreaDragLeave: (e) => { // Refactored to arrow function
        e.currentTarget.classList.remove('drag-over'); // Remove highlight.
    },

    /**
     * Handles a resource being dropped back into the waiting area.
     * @param {Event} e - The drop event.
     */
    handleWaitingAreaDrop: (e) => { // Refactored to arrow function
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over'); // Remove highlight.

        if (!e.dataTransfer.types.includes('text/resource-id')) {
            return;
        }

        const resourceId = e.dataTransfer.getData('text/resource-id');
        const originStoryId = e.dataTransfer.getData('text/origin-story-id');

        let resourceToReturn = DragAndDropManager.resourceManager.getResourceById(resourceId);

        // If resource is not in available pool, it must be on a story.
        if (!resourceToReturn && originStoryId !== 'none') {
            const originStory = DragAndDropManager.storyManager.getStoryById(parseInt(originStoryId)); // Convert to integer
            if (originStory) {
                console.log(`Returning resource ${resourceId} from Story ID: ${originStoryId} to available pool.`);
                resourceToReturn = originStory.allocatedResources.find(res => res.id === resourceId);
                if (resourceToReturn) {
                    originStory.allocatedResources = originStory.allocatedResources.filter(res => res.id !== resourceId);
                }
            }
        } else if (resourceToReturn) {
            console.log(`Resource ${resourceId} already in available pool or dropped from invalid source.`);
            // If it's already in the available pool and was dragged from there, no action needed.
            // If it's not in resourceToReturn and originStoryId is 'none', it implies an invalid drop, but we add it if found.
        }


        if (resourceToReturn) {
            DragAndDropManager.resourceManager.addResource(resourceToReturn); // Add back to available pool.
            resourceToReturn.element.classList.remove('allocated'); // Remove allocated visual state.
            resourceToReturn.element.classList.remove('dragging-resource'); // Remove dragging visual state.
            // The element will be re-rendered by renderAvailableResources.
        }

        // Re-render all elements that might have changed visually.
        DragAndDropManager.resourceManager.renderAvailableResources();
        DragAndDropManager.storyManager.renderAllStories();
    },

    /**
     * Global dragend handler to clean up dragging classes and references.
     * This replaces individual handleStoryDragEnd and handleResourceDragEnd functions.
     * @param {Event} e - The dragend event.
     */
    handleGlobalDragEnd: (e) => {
        if (DragAndDropManager.draggedStoryCard) {
            DragAndDropManager.draggedStoryCard.classList.remove('dragging'); // Remove dragging visual feedback.
        }
        DragAndDropManager.draggedStoryCard = null; // Clear the dragged story reference.

        if (DragAndDropManager.draggedResourceElement) {
            DragAndDropManager.draggedResourceElement.classList.remove('dragging-resource'); // Remove dragging visual feedback.
        }
        DragAndDropManager.draggedResourceElement = null; // Clear the dragged resource reference.
        DragAndDropManager.originalResourceParentStory = null; // Clear the origin story reference.
    }
};

// --- GAME MANAGER OBJECT (MAIN GAME LOGIC) ---
// Orchestrates the entire game, managing state transitions and interactions between other managers.
const GameManager = {
    currentDay: 1,
    maxDays: 35,
    totalProfit: 0,
    isTestModeActive: false, // New: State variable for Test Mode.
    storyManager: StoryManager, // Link to the StoryManager instance.
    resourceManager: ResourceManager, // Link to the ResourceManager instance.
    dragAndDropManager: DragAndDropManager, // Link to the DragAndDropManager instance.

    /**
     * Initializes the entire game: sets up managers, renders initial UI, and attaches main event listeners.
     */
    init: function() {
        this.storyManager.init(); // Initialize stories.
        this.resourceManager.init(); // Initialize resources.
        // Pass manager references to DragAndDropManager for its interactions.
        this.dragAndDropManager.init(this.storyManager, this.resourceManager);

        // Perform initial rendering of resources and stories.
        this.resourceManager.renderAvailableResources();
        this.storyManager.renderAllStories();
        this.updateStatsDisplay(); // Update day and profit display.

        // Attach event listener for the "Complete Round" button.
        completeRoundButton.addEventListener('click', this.completeRound.bind(this)); // Bind for 'this' context.

        // New: Attach event listener for the Test Mode button.
        testModeButton.addEventListener('click', this.toggleTestMode.bind(this));
    },

    /**
     * Updates the day counter and profit display on the UI.
     */
    updateStatsDisplay: function() {
        dayCounterDisplay.textContent = `Day: ${this.currentDay} / ${this.maxDays}`;
        profitDisplay.textContent = `Profit: $${this.totalProfit}`;

        // Disable the "Complete Round" button and show game over message if max days are reached.
        if (this.currentDay >= this.maxDays) {
            completeRoundButton.disabled = true;
            dayCounterDisplay.textContent = `Game Over! Final Day: ${this.currentDay}`;
            // Further game over logic (e.g., showing a final score modal) could be added here.
        }
    },

    /**
     * Toggles the Test Mode on/off and updates the button's appearance.
     */
    toggleTestMode: function() {
        this.isTestModeActive = !this.isTestModeActive;
        if (this.isTestModeActive) {
            testModeButton.textContent = "Test Mode: ON";
            testModeButton.classList.add('active');
            console.log("TEST MODE ENABLED: Drag & drop restrictions lifted, auto-completion active.");
        } else {
            testModeButton.textContent = "Test Mode: OFF";
            testModeButton.classList.remove('active');
            console.log("TEST MODE DISABLED: Normal game rules applied.");
        }
        // Re-render stories to potentially reflect changes in drag restrictions if applicable (though this only affects drop logic)
        this.storyManager.renderAllStories();
    },

    /**
     * Completes the current game round: applies effort, progresses stories, reallocates resources,
     * calculates profit, and increments the day.
     */
    completeRound: function() {
        if (this.currentDay >= this.maxDays) return; // Prevent rounds after game over.

        console.log(`--- Starting Round ${this.currentDay} ---`);
        console.log("Stories before round processing:", this.storyManager.activeStories.length);

        const storiesToReallocateResourcesFrom = []; // Temporarily store stories that completed a phase.

        // If Test Mode is active, automatically complete all in-progress work.
        if (this.isTestModeActive) {
            console.log("Test Mode Active: Auto-completing all in-progress stories.");
            this.storyManager.activeStories.forEach(story => {
                let storyMovedThisRound = false; // Flag to track if story changed status due to auto-completion

                // Check for current in-progress status and force completion.
                if (story.status === 'analyzed-in-progress') {
                    story.analysisEffort = 0;
                    story.status = 'analyzed-done';
                    storyMovedThisRound = true;
                } else if (story.status === 'developed-in-progress') {
                    story.devEffort = 0;
                    story.status = 'developed-done';
                    storyMovedThisRound = true;
                } else if (story.status === 'testing') {
                    story.testEffort = 0;
                    story.status = 'deployed';
                    storyMovedThisRound = true;
                }

                if (storyMovedThisRound) {
                    storiesToReallocateResourcesFrom.push(story);
                    console.log(`Test Mode: Story ID ${story.id} auto-completed to ${story.status}`);
                }
            });
        } else {
            // Normal Mode: Apply effort from allocated resources and check for progression.
            this.storyManager.activeStories.forEach(story => {
                let storyMovedThisRound = false;

                // Increment days in prioritized for stories in that column.
                if (story.status === 'prioritized') {
                    story.daysInPrioritized++;
                }

                // Apply effort from currently allocated resources to the story's relevant effort pool.
                story.allocatedResources.forEach(allocatedRes => {
                    const effortDelivered = getRandomInt(4, 8); // Simulate variable effort delivery.
                    console.log(`Applying ${effortDelivered} effort from ${allocatedRes.type} to Story ID ${story.id} (status: ${story.status})`);

                    if (story.status === 'analyzed-in-progress' && allocatedRes.type === 'analyst') {
                        story.analysisEffort -= effortDelivered;
                        if (story.analysisEffort < 0) story.analysisEffort = 0; // Cap effort at 0.
                        console.log(`Story ID ${story.id} (Analysis): remaining effort ${story.analysisEffort}`);
                    } else if (story.status === 'developed-in-progress' && allocatedRes.type === 'developer') {
                        story.devEffort -= effortDelivered;
                        if (story.devEffort < 0) story.devEffort = 0;
                        console.log(`Story ID ${story.id} (Dev): remaining effort ${story.devEffort}`);
                    } else if (story.status === 'testing' && allocatedRes.type === 'tester') {
                        story.testEffort -= effortDelivered;
                        if (story.testEffort < 0) story.testEffort = 0;
                        console.log(`Story ID ${story.id} (Test): remaining effort ${story.testEffort}`);
                    }
                    // Effort is 'wasted' if the resource type doesn't match the story's current phase.
                });

                // Check for story progression based on effort reaching zero for its current phase.
                if (story.status === 'analyzed-in-progress' && story.analysisEffort === 0) {
                    story.status = 'analyzed-done';
                    storyMovedThisRound = true;
                    console.log(`Story ID ${story.id} moved to analyzed-done.`);
                } else if (story.status === 'developed-in-progress' && story.devEffort === 0) {
                    story.status = 'developed-done';
                    storyMovedThisRound = true;
                    console.log(`Story ID ${story.id} moved to developed-done.`);
                } else if (story.status === 'testing' && story.testEffort === 0) {
                    story.status = 'deployed';
                    storyMovedThisRound = true;
                    console.log(`Story ID ${story.id} moved to deployed.`);
                }

                // If a story completed a phase, its allocated resources should be returned to the pool.
                if (storyMovedThisRound) {
                    storiesToReallocateResourcesFrom.push(story);
                }
            });
        }


        // Reallocate resources: move resources from completed stories back to the available pool.
        storiesToReallocateResourcesFrom.forEach(story => {
            story.allocatedResources.forEach(res => {
                res.element.classList.remove('allocated'); // Remove visual "allocated" state.
                this.resourceManager.addResource(res); // Add resource back to available pool via manager.
                console.log(`Resource ${res.id} returned to available pool from Story ID ${story.id}.`);
            });
            story.allocatedResources = []; // Clear allocated resources for this story in the data model.
        });

        // Profit calculation: Sum prices of all stories currently in the 'deployed' column and add to totalProfit.
        // This implements the recurring profit model.
        let deployedProfitThisRound = 0;
        this.storyManager.getDeployedStories().forEach(deployedStory => {
            deployedProfitThisRound += deployedStory.price;
        });
        this.totalProfit += deployedProfitThisRound;
        console.log(`Profit this round from deployed stories: $${deployedProfitThisRound}. Total profit: $${this.totalProfit}`);


        this.currentDay++; // Advance the game day.
        this.storyManager.replenishBacklog(); // Add new stories to backlog if needed.
        this.updateStatsDisplay(); // Update UI for day and profit.
        this.resourceManager.renderAvailableResources(); // Re-render available resources.
        this.storyManager.renderAllStories(); // Re-render all stories to reflect changes.
        console.log(`--- Round ${this.currentDay - 1} Completed. New Day: ${this.currentDay} ---`);
    }
};

// --- Initial Game Setup ---
// Start the game by initializing the GameManager when the script loads.
// This is the single entry point for starting the game logic.
GameManager.init();
