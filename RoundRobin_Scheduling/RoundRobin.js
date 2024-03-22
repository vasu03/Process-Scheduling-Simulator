// Function to generate inputs for processes based on user input
function generateInputs() {
    // Get the number of processes from the input field
    const numProcesses = parseInt(document.getElementById('num_processes').value);
    // Get the container for process inputs
    const processInputsDiv = document.getElementById('processInputs');
    processInputsDiv.innerHTML = '';                                // Clear previous inputs

    // Loop to create input fields for each process
    for (let i = 0; i < numProcesses; i++) {
        const processDiv = document.createElement('div');       // Create a div for each process
        processDiv.classList.add('process-input');              // Add a CSS class for styling

        // Create input field and label for arrival time
        const arrivalLabel = document.createElement('label');
        arrivalLabel.textContent = `AT for Process ${i+1}:`;
        const arrivalInput = document.createElement('input');
        arrivalInput.type = 'number';
        arrivalInput.classList.add('arrival-time');
        arrivalInput.step = '0.5'; // Set step value for input field

        // Create input field and label for burst time
        const burstLabel = document.createElement('label');
        burstLabel.textContent = `BT for Process ${i+1}:`;
        const burstInput = document.createElement('input');
        burstInput.type = 'number';
        burstInput.classList.add('burst-time');
        burstInput.step = '0.5'; // Set step value for input field

        // Append labels and input fields to process div
        processDiv.appendChild(arrivalLabel);
        processDiv.appendChild(arrivalInput);
        processDiv.appendChild(burstLabel);
        processDiv.appendChild(burstInput);

        // Append process div to container
        processInputsDiv.appendChild(processDiv);
    }
}

// Function to update the process table with process information
function updateProcessTable(processesInfo, processTable) {
    processTable.innerHTML = ''; // Clear previous content

    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    processesInfo.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${process.job}</td>
            <td>${process.at}</td>
            <td>${process.bt}</td>
            <td>${process.ft}</td>
            <td>${process.tat}</td>
            <td>${process.wat}</td>
        `;
        processTable.appendChild(row);

        // Calculate total waiting time and total turnaround time
        totalWaitingTime += process.wat;
        totalTurnaroundTime += process.tat;
    });

    // Calculate average waiting time and average turnaround time
    const numProcesses = processesInfo.length;
    const averageWaitingTime = totalWaitingTime / numProcesses;
    const averageTurnaroundTime = totalTurnaroundTime / numProcesses;

    // Append rows for Average Waiting Time and Average Turnaround Time
    const averageWaitingRow = document.createElement('tr');
    averageWaitingRow.innerHTML = `<td colspan="5">Average Waiting Time:</td><td>${averageWaitingTime.toFixed(2)}</td>`;
    processTable.appendChild(averageWaitingRow);

    const averageTurnaroundRow = document.createElement('tr');
    averageTurnaroundRow.innerHTML = `<td colspan="5">Average Turnaround Time:</td><td>${averageTurnaroundTime.toFixed(2)}</td>`;
    processTable.appendChild(averageTurnaroundRow);
}

// Function to generate the Gantt Chart
function generateGantt() {
    const timeQuantum = parseFloat(document.getElementById('time_quantum').value);
    const arrivalInputs = document.querySelectorAll('.arrival-time');
    const burstInputs = document.querySelectorAll('.burst-time');

    const arrivalTime = [];
    const burstTime = [];

    arrivalInputs.forEach(input => arrivalTime.push(parseFloat(input.value)));
    burstInputs.forEach(input => burstTime.push(parseFloat(input.value)));

    const { ganttChartInfo, readyQueueInfo, solvedProcessesInfo } = rr(arrivalTime, burstTime, timeQuantum);

    const ganttChart = document.getElementById('ganttChart');
    const readyQueueChart = document.getElementById('readyQueueChart');
    const processTable = document.getElementById('processTable').querySelector('tbody');

    // Animate Ready queue
    animateReadyQueue(readyQueueInfo, readyQueueChart);

    // Insert idle time in Gantt chart
    insertIdleTime(ganttChartInfo);

    // Animate Gantt chart
    animateGanttChart(ganttChartInfo, ganttChart);

    // Update process table
    updateProcessTable(solvedProcessesInfo, processTable);
}

// Function to insert idle time in the Gantt chart
function insertIdleTime(ganttChartInfo) {
    const updatedGanttChartInfo = [];

    // Iterate through Gantt chart info to find gaps between processes
    for (let i = 0; i < ganttChartInfo.length - 1; i++) {
        const currentProcessEnd = ganttChartInfo[i].stop;
        const nextProcessStart = ganttChartInfo[i + 1].start;

        // If there's a gap, insert idle process
        if (currentProcessEnd < nextProcessStart) {
            updatedGanttChartInfo.push({
                job: '-',
                start: currentProcessEnd,
                stop: nextProcessStart,
            });
        }
    }

    // Combine original and idle-time segments
    ganttChartInfo.push(...updatedGanttChartInfo);

    // Sort the combined array based on start time
    ganttChartInfo.sort((a, b) => a.start - b.start);
}

// Function to animate the Ready queue
function animateReadyQueue(readyQueueInfo, readyQueueChart) {
    readyQueueChart.innerHTML = ''; // Clear previous content

    let totalDelay = 0;
    readyQueueInfo.forEach(info => {
        setTimeout(() => {
            const processElement = document.createElement('div');
            processElement.classList.add('process');
            processElement.textContent = `${info.job}`;
            processElement.style.width = '0'; // Set initial width to 0
            readyQueueChart.appendChild(processElement);

            // Trigger reflow
            processElement.offsetWidth;

            // Add class to trigger transition
            processElement.style.width = `${info.duration * 40}px`;
        }, totalDelay);
        totalDelay += info.duration * 1000; // Convert duration to milliseconds
    });
}

// Function to animate the Gantt chart
function animateGanttChart(ganttChartInfo, ganttChart) {
    ganttChart.innerHTML = ''; // Clear previous content

    let totalDelay = 0;
    ganttChartInfo.forEach(info => {
        setTimeout(() => {
            const processElement = document.createElement('div');
            processElement.classList.add('process');
            processElement.textContent = `${info.job}\n${info.stop - info.start}s`;
            processElement.style.width = '0'; // Set initial width to 0
            
            // Add a different class for idle time processes
            if (info.job === '-') {
                processElement.classList.add('idle-process');
            }
            
            ganttChart.appendChild(processElement);

            // Trigger reflow
            processElement.offsetWidth;

            // Add class to trigger transition
            processElement.style.width = `${(info.stop - info.start) * 35}px`;
        }, totalDelay);
        totalDelay += (info.stop - info.start) * 1000; // Convert duration to milliseconds
    });
}

// Function implementing round-robin scheduling algorithm
function rr(arrivalTime, burstTime, timeQuantum) {
    // Initialize arrays to store process information
    const processesInfo = arrivalTime.map((item, index) => {
        // Generate job ID for each process
        const job = arrivalTime.length > 26 ? `P${index + 1}` : (index + 10).toString(36).toUpperCase();
        return {
            job,
            at: item, // Arrival time
            bt: burstTime[index], // Burst time
        };
    }).sort((obj1, obj2) => {
        // Sort processes by arrival time
        if (obj1.at > obj2.at) return 1;
        if (obj1.at < obj2.at) return -1;
        return 0;
    });

    // Initialize arrays to store scheduling information
    const solvedProcessesInfo = [];
    const ganttChartInfo = [];
    const readyQueueInfo = [];

    // Initialize ready queue, current time, and unfinished jobs
    const readyQueue = [];
    let currentTime = processesInfo[0].at;
    const unfinishedJobs = [...processesInfo];

    // Initialize remaining time for each process
    const remainingTime = processesInfo.reduce((acc, process) => {
        acc[process.job] = process.bt;
        return acc;
    }, {});

    // Initialize ready queue with the first job
    readyQueue.push(unfinishedJobs[0]);

    // Loop until all jobs are executed
    while (
        Object.values(remainingTime).reduce((acc, cur) => acc + cur, 0) &&
        unfinishedJobs.length > 0
    ) {
        // Add jobs to ready queue as they arrive
        if (readyQueue.length === 0 && unfinishedJobs.length > 0) {
            readyQueue.push(unfinishedJobs[0]);
            currentTime = readyQueue[0].at;
        }

        // Select process to execute from the ready queue
        const processToExecute = readyQueue[0];

        // Execute the process for the time quantum or until completion
        if (remainingTime[processToExecute.job] <= timeQuantum) {
            const remainingT = remainingTime[processToExecute.job];
            remainingTime[processToExecute.job] -= remainingT;
            const prevCurrentTime = currentTime;
            currentTime += remainingT;

            // Update Gantt chart and Ready queue info
            ganttChartInfo.push({ job: processToExecute.job, start: prevCurrentTime, stop: currentTime });
            readyQueueInfo.push({ job: processToExecute.job, duration: remainingT });
        } else {
            remainingTime[processToExecute.job] -= timeQuantum;
            const prevCurrentTime = currentTime;
            currentTime += timeQuantum;

            // Update Gantt chart and Ready queue info
            ganttChartInfo.push({ job: processToExecute.job, start: prevCurrentTime, stop: currentTime });
            readyQueueInfo.push({ job: processToExecute.job, duration: timeQuantum });
        }

        // Add processes that arrive during execution to the ready queue
        const processToArriveInThisCycle = processesInfo.filter(p => {
            return (
                p.at <= currentTime &&
                p !== processToExecute &&
                !readyQueue.includes(p) &&
                unfinishedJobs.includes(p)
            );
        });
        readyQueue.push(...processToArriveInThisCycle);
        readyQueue.push(readyQueue.shift());

        // Remove completed jobs from the unfinished jobs list
        if (remainingTime[processToExecute.job] === 0) {
            const indexToRemoveUJ = unfinishedJobs.indexOf(processToExecute);
            if (indexToRemoveUJ > -1) {
                unfinishedJobs.splice(indexToRemoveUJ, 1);
            }
            const indexToRemoveRQ = readyQueue.indexOf(processToExecute);
            if (indexToRemoveRQ > -1) {
                readyQueue.splice(indexToRemoveRQ, 1);
            }

            // Store completion time and calculate turnaround and waiting times
            solvedProcessesInfo.push({
                ...processToExecute,
                ft: currentTime,
                tat: currentTime - processToExecute.at,
                wat: currentTime - processToExecute.at - processToExecute.bt,
                rt: processToExecute.at - processToExecute.at,
            });
        }
    }

    // Sort solved processes by arrival time and job ID
    solvedProcessesInfo.sort((obj1, obj2) => {
        if (obj1.at > obj2.at) return 1;
        if (obj1.at < obj2.at) return -1;
        if (obj1.job > obj2.job) return 1;
        if (obj1.job < obj2.job) return -1;
        return 0;
    });

    // Return Gantt chart, Ready queue, and solved processes information
    return { ganttChartInfo, readyQueueInfo, solvedProcessesInfo };
}