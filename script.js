document.addEventListener("DOMContentLoaded", function () {
    let personnel = [];
    let holidays = [];
    let dayShiftCount = {}; // Track day shift assignments

    // Format date function for Minguo year
    function formatDate(date) {
        const year = date.getFullYear() - 1911; // Convert to Minguo year
        const month = date.getMonth() + 1; // Month is 0-based, so add 1
        const day = date.getDate();

        // Format as "113年12月25日"
        return `${year}年${month}月${day}日`;
    }

    // Update personnel list UI
    function updatePersonnelList() {
        const list = document.getElementById("personnelList");
        list.innerHTML = "";
        personnel.forEach(person => {
            const li = document.createElement("li");
            li.textContent = `${person.name}`;
            list.appendChild(li);
        });
    }

    // Add holiday
    document.getElementById("addHolidayButton").addEventListener("click", function () {
        const holidayInput = document.getElementById("holidayInput").value;
        
        // Parse the input date in YYYY-MM-DD format
        const holidayDate = new Date(holidayInput);
        
        // Check if the input is a valid date
        if (!isNaN(holidayDate.getTime())) {
            const formattedHoliday = formatDate(holidayDate); // Format to Minguo year
            if (formattedHoliday && !holidays.includes(formattedHoliday)) {
                holidays.push(formattedHoliday);
                updateHolidayList();
            }
        } else {
            alert("Please enter a valid date in YYYY-MM-DD format.");
        }
    });

    // Update holiday list UI
    function updateHolidayList() {
        const list = document.getElementById("holidayList");
        list.innerHTML = "";
        holidays.forEach(holiday => {
            const li = document.createElement("li");
            li.textContent = holiday; // This will already be in Minguo format
            list.appendChild(li);
        });
    }

    // Generate shifts based on selected time period
    document.getElementById("generateButton").addEventListener("click", function () {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        if (!startDate || !endDate) {
            alert("Please select a valid time period.");
            return;
        }

        // Initialize dayShiftCount for personnel
        dayShiftCount = {};
        personnel.forEach(person => {
            dayShiftCount[person.name] = 0; // Reset counts for new month
        });

        // Generate schedule within the selected date range
        generateShifts(startDate, endDate);
    });

    // Function to generate shifts within a date range
    function generateShifts(startDate, endDate) {
        // Clear the table first
        const table = document.getElementById("scheduleTable");
        table.innerHTML = `
            <tr>
                <th>日期</th>
                <th>星期</th>
                <th>日班</th>
                <th>夜班</th>
            </tr>
        `;

        const start = new Date(startDate);
        const end = new Date(endDate);
        let lastDayShift = {};
        let lastNightShift = {};

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dateStr = formatDate(date); // Call the formatDate function
            const dayOfWeek = date.toLocaleDateString('zh-TW', { weekday: 'long' });

            const isWeekend = (dayOfWeek === "星期六" || dayOfWeek === "星期日");
            const isHoliday = holidays.includes(dateStr);
            const isSpecialDay = isWeekend || isHoliday;

            let dayShift = isSpecialDay ? getAvailableShift('day', lastDayShift, lastNightShift[dateStr]) : "-";
            let nightShift = getAvailableShift('night', lastNightShift, dayShift, lastDayShift[dateStr]);

            // Add row to the schedule table
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${dateStr}</td>
                <td>${dayOfWeek}</td>
                <td>${dayShift}</td>
                <td>${nightShift}</td>
            `;
            table.appendChild(row);

            if (dayShift !== "-") lastDayShift[dateStr] = dayShift;
            if (nightShift !== "-") lastNightShift[dateStr] = nightShift;
        }
    }

    // Function to get an available shift, ensuring no consecutive assignments or invalid transitions
    function getAvailableShift(shiftType, lastShift, currentShift = null, conflictingShift = null) {
        let availableShift = "";
        let attempts = 0;

        if (shiftType === 'day') {
            // Ensure no day shift follows a night shift from the previous day
            do {
                availableShift = personnel[Math.floor(Math.random() * personnel.length)].name;
                attempts++;
            } while (
                (availableShift === lastShift[Object.keys(lastShift).pop()]) || // No consecutive day shifts
                (availableShift === conflictingShift) || // No night shift before the day shift
                (dayShiftCount[availableShift] >= 1 && attempts < 100) // Limit day shifts to 1 per month
            );

            // Increment day shift count if assigned
            if (attempts < 100 && availableShift) {
                dayShiftCount[availableShift]++;
            }
        } else if (shiftType === 'night') {
            // Ensure no night shift follows a night shift or a day shift on the same or previous day
            do {
                availableShift = personnel[Math.floor(Math.random() * personnel.length)].name;
                attempts++;
            } while (
                (availableShift === lastShift[Object.keys(lastShift).pop()]) || // No consecutive night shifts
                personnel.find(p => p.name === availableShift)?.gender === "female" || // No female night shifts
                (availableShift === currentShift) || // No night shift after a day shift
                attempts < 100
            );
        }

        return availableShift;
    }

    // Upload personnel list from CSV
    document.getElementById("uploadPersonnelButton").addEventListener("click", function () {
        const fileInput = document.getElementById("uploadPersonnel").files[0];
        if (!fileInput) {
            alert("Please select a file to upload.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const csvData = event.target.result;
            const lines = csvData.split("\n");

            // Process each line in the CSV file
            lines.forEach(line => {
                const [name, gender] = line.split(",");
                if (name && gender) {
                    personnel.push({ name: name.trim(), gender: gender.trim().toLowerCase() });
                }
            });

            updatePersonnelList();
        };
        reader.readAsText(fileInput);
    });
});
