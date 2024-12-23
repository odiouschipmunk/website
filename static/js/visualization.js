// Initialize 3D Court Visualization
function init3DCourt() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    const container = document.getElementById('court3d');
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Court dimensions (in meters)
    const courtLength = 9.75;
    const courtWidth = 6.4;
    const courtHeight = 4.57;

    // Create court floor
    const floorGeometry = new THREE.PlaneGeometry(courtWidth, courtLength);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Create court walls
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.5 });
    
    // Front wall
    const frontWallGeometry = new THREE.PlaneGeometry(courtWidth, courtHeight);
    const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    frontWall.position.set(0, courtHeight/2, -courtLength/2);
    scene.add(frontWall);

    // Side walls
    const sideWallGeometry = new THREE.PlaneGeometry(courtLength, courtHeight);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-courtWidth/2, courtHeight/2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(courtWidth/2, courtHeight/2, 0);
    scene.add(rightWall);

    // Add player trails
    const player1Material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const player2Material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const ballMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    function createTrail(positions, material) {
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(positions.flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        return new THREE.Line(geometry, material);
    }

    if (positionsData.player1.length > 0) {
        const player1Trail = createTrail(positionsData.player1, player1Material);
        scene.add(player1Trail);
    }

    if (positionsData.player2.length > 0) {
        const player2Trail = createTrail(positionsData.player2, player2Material);
        scene.add(player2Trail);
    }

    if (positionsData.ball.length > 0) {
        const ballTrail = createTrail(positionsData.ball, ballMaterial);
        scene.add(ballTrail);
    }

    // Position camera
    camera.position.set(courtWidth, courtHeight * 1.5, courtLength);
    camera.lookAt(0, 0, 0);

    // Animation
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });
}

// Initialize Shot Distribution Chart
function initShotDistribution() {
    const ctx = document.getElementById('shotDistribution').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(shotTypes),
            datasets: [{
                data: Object.values(shotTypes),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Shot Distribution'
                }
            }
        }
    });
}

// Initialize Player Heatmaps
function initHeatmaps() {
    // Common layout settings
    const commonLayout = {
        showscale: true,
        margin: { t: 50, r: 50, b: 50, l: 50 },
        xaxis: {
            title: 'Court Width (m)',
            range: [0, 6.4],  // Court width in meters
            gridcolor: '#e0e0e0',
            zerolinecolor: '#969696',
            showgrid: true,
        },
        yaxis: {
            title: 'Court Length (m)',
            range: [0, 9.75],  // Court length in meters
            gridcolor: '#e0e0e0',
            zerolinecolor: '#969696',
            showgrid: true,
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(245,245,245,0.9)',
    };

    // Custom color scale
    const customColorscale = [
        [0, 'rgba(0,0,255,0)'],     // Transparent for no activity
        [0.1, 'rgba(0,0,255,0.3)'],  // Light blue for low activity
        [0.3, 'rgba(0,255,255,0.5)'], // Cyan for medium-low activity
        [0.5, 'rgba(0,255,0,0.7)'],   // Green for medium activity
        [0.7, 'rgba(255,255,0,0.8)'], // Yellow for medium-high activity
        [0.9, 'rgba(255,128,0,0.9)'], // Orange for high activity
        [1, 'rgba(255,0,0,1)']        // Red for peak activity
    ];

    // Create heatmap for Player 1
    const player1Data = {
        x: positionsData.player1.map(pos => pos[0]),
        y: positionsData.player1.map(pos => pos[1]),
        type: 'histogram2d',
        colorscale: customColorscale,
        nbinsx: 32,  // Increase bin count for smoother appearance
        nbinsy: 48,
        showscale: true,
        colorbar: {
            title: 'Frequency',
            titleside: 'right',
            thickness: 20,
            thicknessmode: 'pixels',
            outlinewidth: 1,
            outlinecolor: '#969696',
            tickformat: '.0f'
        },
        hoverongaps: false,
        hovertemplate: 
            'Width: %{x:.1f}m<br>' +
            'Length: %{y:.1f}m<br>' +
            'Count: %{z}<extra></extra>'
    };

    const player1Layout = {
        ...commonLayout,
        title: {
            text: 'Player 1 Position Heatmap',
            font: { size: 16, color: '#2c3e50' }
        },
        annotations: [{
            x: 3.2,  // T position
            y: 4.57,
            text: 'T',
            showarrow: false,
            font: { size: 16, color: '#2c3e50' }
        }]
    };

    // Create heatmap for Player 2
    const player2Data = {
        ...player1Data,
        x: positionsData.player2.map(pos => pos[0]),
        y: positionsData.player2.map(pos => pos[1])
    };

    const player2Layout = {
        ...commonLayout,
        title: {
            text: 'Player 2 Position Heatmap',
            font: { size: 16, color: '#2c3e50' }
        },
        annotations: [{
            x: 3.2,  // T position
            y: 4.57,
            text: 'T',
            showarrow: false,
            font: { size: 16, color: '#2c3e50' }
        }]
    };

    // Plot configuration
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: 'heatmap',
            height: 800,
            width: 1200,
            scale: 2
        }
    };

    // Add court markings
    const courtMarkings = {
        type: 'scatter',
        mode: 'lines',
        x: [0, 6.4, 6.4, 0, 0],
        y: [0, 0, 9.75, 9.75, 0],
        line: {
            color: '#2c3e50',
            width: 2
        },
        showlegend: false,
        hoverinfo: 'skip'
    };

    // Service box
    const serviceBox = {
        type: 'scatter',
        mode: 'lines',
        x: [0, 6.4],
        y: [4.57, 4.57],
        line: {
            color: '#2c3e50',
            width: 1,
            dash: 'dash'
        },
        showlegend: false,
        hoverinfo: 'skip'
    };

    // Plot heatmaps with court markings
    Plotly.newPlot('player1Heatmap', [player1Data, courtMarkings, serviceBox], player1Layout, config);
    Plotly.newPlot('player2Heatmap', [player2Data, courtMarkings, serviceBox], player2Layout, config);
}

// Initialize all visualizations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initShotDistribution();
    initHeatmaps();
}); 