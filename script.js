document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const createWheelButton = document.getElementById('createWheelButton');
    const namesInput = document.getElementById('namesInput');
    const optionsInput = document.getElementById('optionsInput');
    const wheelSection = document.getElementById('wheelSection'); // Use the section
    const wheelContainer = document.getElementById('wheelContainer');
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spinButton');
    const resultContainer = document.getElementById('resultContainer');
    const resultList = document.getElementById('resultList');
    const saifNote = document.getElementById('saifNote');
    const configForm = document.getElementById('configForm'); // Get form section


    // Store data globally within this scope
    let currentNames = [];
    let currentOptions = [];
    let isSpinning = false;

    // Vibrant colors for the wheel slices
    const sliceColors = [
        '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
        '#F7A072', '#ED6A5A', '#7FD1B9', '#6D6875', '#B58DB6'
    ];

    // Event Listeners
    createWheelButton.addEventListener('click', handleCreateWheel);
    spinButton.addEventListener('click', handleSpinWheel);

    // --- Functions ---

    function handleCreateWheel() {
        currentNames = namesInput.value.split(',').map(n => n.trim()).filter(n => n);
        currentOptions = optionsInput.value.split(',').map(o => o.trim()).filter(o => o);

        if (currentOptions.length < 2) {
            alert('Please enter at least two options.');
            return;
        }
        if (currentNames.length === 0) {
            alert('Please enter at least one name.');
            return;
        }

        // Hide config form and results, show wheel
        // configForm.style.display = 'none'; // Optional: Hide form after creation
        resultContainer.classList.remove('visible');
        resultContainer.style.display = 'none';
        saifNote.style.display = 'none'; // Hide Saif note initially
        wheelSection.style.display = 'block';
        // Trigger reflow for animation
        void wheelSection.offsetWidth;
        wheelSection.classList.add('fade-in');


        drawWheel(currentOptions);

        // Reset spin button state
        spinButton.disabled = false;
        spinButton.textContent = 'Spin the Wheel';
        isSpinning = false;

         // Reset wheel rotation
         wheel.style.transition = 'none'; // Remove transition for reset
         wheel.style.transform = 'rotate(0deg)';
         // Force reflow to apply the reset immediately
         void wheel.offsetWidth;
    }

    function drawWheel(options) {
        wheel.innerHTML = ''; // Clear previous wheel
        const totalSlices = options.length;
        const sliceAngle = 360 / totalSlices;

        // Generate conic gradient background string
        let gradientString = 'conic-gradient(from 0deg, ';
        const colorStops = options.map((_, i) => {
            const color = sliceColors[i % sliceColors.length];
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;
            return `${color} ${startAngle}deg ${endAngle}deg`;
        });
        gradientString += colorStops.join(', ') + ')';
        wheel.style.background = gradientString;


        // Create visual slices mainly for text placement (background is handled by conic-gradient)
        options.forEach((option, i) => {
            const slice = document.createElement('div');
            slice.className = 'slice';
            // We don't strictly need background colors on slices if using conic-gradient,
            // but can keep them as fallback or for borders
            // slice.style.backgroundColor = sliceColors[i % sliceColors.length];

            // --- Improved Text Placement ---
            const textWrapper = document.createElement('div');
            textWrapper.className = 'text-wrapper';

            const textElem = document.createElement('span'); // Use span for inline characteristics
            textElem.className = 'text';
            textElem.textContent = option;

            // Rotate the wrapper so the text baseline is towards the center
            const wrapperRotation = sliceAngle * i + sliceAngle / 2;
            textWrapper.style.transform = `rotate(${wrapperRotation}deg)`;

            textWrapper.appendChild(textElem);
            slice.appendChild(textWrapper);
            wheel.appendChild(slice); // Append the slice container
        });
    }


    function handleSpinWheel() {
        if (isSpinning || currentNames.length === 0 || currentOptions.length < 2) {
            return; // Prevent spin if already spinning or data missing
        }

        isSpinning = true;
        spinButton.disabled = true;
        spinButton.textContent = 'Spinning...';
        resultContainer.classList.remove('visible'); // Hide old results
        resultContainer.style.display = 'none';
        saifNote.style.display = 'none';

        // --- SPIN ANIMATION ---
        // The visual spin is mostly for show in this logic. The actual assignment happens after.
        // Calculate a random spin amount. Add extra rotations for effect.
        const currentRotation = getCurrentRotation(wheel);
        const randomDegrees = Math.random() * 360;
        const totalRotation = 360 * 8 + randomDegrees; // Spin at least 8 times + random amount
        const finalRotation = currentRotation + totalRotation;

        wheel.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;

        // Process assignments AFTER the spin animation completes
        setTimeout(() => {
            const assignments = assignOptions(currentNames, currentOptions);
            displayResults(assignments);

            // Reset button, allow spinning again
            spinButton.disabled = false;
            spinButton.textContent = 'Spin Again';
            isSpinning = false;
        }, 6000); // Match CSS transition duration
    }

    function getCurrentRotation(element) {
        const st = window.getComputedStyle(element, null);
        const tm = st.getPropertyValue("-webkit-transform") ||
                   st.getPropertyValue("-moz-transform") ||
                   st.getPropertyValue("-ms-transform") ||
                   st.getPropertyValue("-o-transform") ||
                   st.getPropertyValue("transform");
        if (tm && tm !== 'none') {
            const values = tm.split('(')[1].split(')')[0].split(',');
            const angle = Math.round(Math.atan2(values[1], values[0]) * (180/Math.PI));
            return (angle < 0 ? angle + 360 : angle); // Normalize to 0-360
        }
        return 0;
    }


    function assignOptions(names, options) {
        let assignments = [];
        let availableOptions = [...options]; // Copy options
        let remainingNames = [...names]; // Copy names
        let saifAssigned = false;

        // Special condition for "Saif"
        const saifIndex = remainingNames.findIndex(name => name.toLowerCase() === 'saif');

        if (saifIndex !== -1 && availableOptions.length > 0) {
            const saifName = remainingNames.splice(saifIndex, 1)[0]; // Remove Saif from list
            const saifOption = availableOptions.splice(0, 1)[0]; // Assign and remove first option
            assignments.push({ name: saifName, option: saifOption, isSaif: true });
            saifAssigned = true;
        }

        // Shuffle remaining names and options for randomness
        shuffleArray(remainingNames);
        shuffleArray(availableOptions);

        // Assign remaining options to remaining names
        remainingNames.forEach((name, index) => {
            // If more names than options (after Saif's), cycle through available options
            const optionIndex = index % availableOptions.length;
            const assignedOption = availableOptions.length > 0 ? availableOptions[optionIndex] : "No option left"; // Handle edge case
             assignments.push({ name, option: assignedOption, isSaif: false });
        });


        // Optional: Sort results alphabetically by name, or keep random order?
        // assignments.sort((a, b) => a.name.localeCompare(b.name));

        // Ensure Saif's result is handled correctly if sorting
        if (saifAssigned) {
             // Make sure Saif's pre-assigned result isn't lost if sorting/shuffling logic changes
             // Could re-insert it or handle sorting more carefully.
             // For simplicity now, we assign Saif first, then randomize others.
        }


        return assignments;
    }

    function displayResults(assignments) {
        resultList.innerHTML = ''; // Clear previous results

        let saifWasPresent = false;
        assignments.forEach((assign, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="result-name">${assign.name}</span>
                <span class="result-arrow">➔</span>
                <span class="result-option">${assign.option}</span>
            `;
            if (assign.isSaif) {
                
                saifWasPresent = true;
            }

            resultList.appendChild(li);

            // Staggered fade-in animation using JS timer + CSS class
             setTimeout(() => {
                li.classList.add('visible');
             }, index * 150); // Stagger delay
        });

        // Show the Saif note if he was in the list
        if (saifWasPresent) {
            saifNote.style.display = 'block';
        } else {
             saifNote.style.display = 'none';
        }

        // Show the result container with animation
        resultContainer.style.display = 'block';
        // Trigger reflow for animation
        void resultContainer.offsetWidth;
        resultContainer.classList.add('visible');

        // Optional: Add confetti
        if (assignments.length > 0) { // Only show confetti if there are results
             createConfetti(200); // Launch 200 pieces of confetti
        }
    }


    // Fisher-Yates (Knuth) Shuffle Algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // --- Confetti --- (Using CSS animation defined in style.css)
    function createConfetti(count = 100) {
        // Target the result container specifically for confetti origin
        const confettiContainer = document.getElementById('resultContainer');
        if (!confettiContainer) return; // Exit if container not found

        // Get container dimensions to constrain starting position
        const containerRect = confettiContainer.getBoundingClientRect();

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';

            // Style randomization
            confetti.style.backgroundColor = sliceColors[Math.floor(Math.random() * sliceColors.length)];
            // Start within the horizontal bounds of the result container
            confetti.style.left = Math.random() * containerRect.width + 'px';
            // Start slightly above the container top for a 'burst' effect
            confetti.style.top = (Math.random() * -20) - 10 + 'px'; // Start -10px to -30px above container top

            confetti.style.width = Math.random() * 8 + 6 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.opacity = Math.random() * 0.5 + 0.5;

            const shape = Math.random();
             if (shape < 0.5) {
                 confetti.style.borderRadius = '50%'; // Circle
             } // else: square

            // Animation (using the keyframes defined in CSS)
            const duration = Math.random() * 4 + 3;
            const delay = Math.random() * 0.2; // Reduce max delay so they appear closer together

            // Apply animation using CSS class and inline styles for dynamic parts
             confetti.style.animation = `confettiFall ${duration}s linear ${delay}s forwards`;

            // IMPORTANT: Append to the result container
            confettiContainer.appendChild(confetti);

            // Remove confetti element after animation + buffer
            setTimeout(() => {
                confetti.remove();
            }, (duration + delay + 0.5) * 1000);
        }
    }


}); // End DOMContentLoaded