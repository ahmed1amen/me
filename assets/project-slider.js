// Projects slider functionality
class ProjectSlider {
  constructor() {
    this.autoPlayIntervals = [];
  }

  // Function to create a project card HTML
  createProjectCard(project) {
    return `
      <a href="${project.url}" target="_blank" class="project-card">
        <svg class="external-link-icon" viewBox="0 0 24 24">
          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
        </svg>
        <img src="${project.image}" alt="${project.name}" class="project-favicon" onerror="handleImageError(this)" />
        <div class="project-name">${project.name}</div>
        <div class="project-url">${project.displayUrl}</div>
      </a>
    `;
  }

  // Function to split projects into two rows
  splitProjectsIntoRows() {
    const midPoint = Math.ceil(projects.length / 2);
    return {
      row1: projects.slice(0, midPoint),
      row2: projects.slice(midPoint)
    };
  }

  // Function to render projects in sliders
  renderProjectSliders() {
    const track1 = document.getElementById("projects-track-1");
    const track2 = document.getElementById("projects-track-2");
    
    if (track1 && track2) {
      const { row1, row2 } = this.splitProjectsIntoRows();
      
      // Clear existing content
      track1.innerHTML = "";
      track2.innerHTML = "";

      // Generate first row
      row1.forEach(project => {
        track1.innerHTML += this.createProjectCard(project);
      });

      // Generate second row
      row2.forEach(project => {
        track2.innerHTML += this.createProjectCard(project);
      });
    }
  }

  // Drag functionality for sliders
  initializeDragSliders() {
    const sliders = document.querySelectorAll('.projects-slider');
    
    sliders.forEach(slider => {
      const track = slider.querySelector('.projects-track');
      let isDown = false;
      let startX;
      let scrollLeft;
      let hasMoved = false;

      // Mouse events
      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        hasMoved = false;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
        
        // Prevent text selection during drag
        e.preventDefault();
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
      });

      slider.addEventListener('mouseup', (e) => {
        isDown = false;
        slider.classList.remove('active');
        slider.style.cursor = 'grab';
        
        // If we didn't move much, allow the link click
        if (!hasMoved) {
          // Find if we clicked on a project card link
          const projectCard = e.target.closest('.project-card');
          if (projectCard && projectCard.href) {
            // Small delay to ensure drag state is cleared
            setTimeout(() => {
              window.open(projectCard.href, '_blank');
            }, 10);
          }
        }
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed multiplier
        
        // If we've moved more than 5 pixels, consider it a drag
        if (Math.abs(walk) > 5) {
          hasMoved = true;
        }
        
        slider.scrollLeft = scrollLeft - walk;
      });

      // Touch events for mobile
      slider.addEventListener('touchstart', (e) => {
        isDown = true;
        hasMoved = false;
        startX = e.touches[0].pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      slider.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        
        // If we've moved more than 5 pixels, consider it a drag
        if (Math.abs(walk) > 5) {
          hasMoved = true;
        }
        
        slider.scrollLeft = scrollLeft - walk;
      });

      slider.addEventListener('touchend', (e) => {
        isDown = false;
        
        // If we didn't move much, allow the link click
        if (!hasMoved) {
          const projectCard = e.target.closest('.project-card');
          if (projectCard && projectCard.href) {
            setTimeout(() => {
              window.open(projectCard.href, '_blank');
            }, 10);
          }
        }
      });

      // Prevent default link behavior during potential drag
      slider.addEventListener('click', (e) => {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      });

      // Set initial cursor
      slider.style.cursor = 'grab';
    });
  }

  // Auto-play functionality for sliders
  initializeAutoPlay() {
    const sliders = document.querySelectorAll('.projects-slider');
    
    sliders.forEach((slider, index) => {
      let isUserInteracting = false;
      let autoPlayDirection = 1; // 1 for forward, -1 for backward
      
      // Auto-play function
      const autoPlay = () => {
        if (isUserInteracting) return;
        
        const track = slider.querySelector('.projects-track');
        const maxScroll = track.scrollWidth - slider.clientWidth;
        const scrollStep = 1; // Pixels to scroll per frame
        
        // Check if we need to reverse direction
        if (slider.scrollLeft >= maxScroll - 10) {
          autoPlayDirection = -1;
        } else if (slider.scrollLeft <= 10) {
          autoPlayDirection = 1;
        }
        
        // Scroll the slider
        slider.scrollLeft += scrollStep * autoPlayDirection;
      };
      
      // Start auto-play with different speeds for each slider
      const speed = index === 0 ? 30 : 40; // Different speeds for variety
      const intervalId = setInterval(autoPlay, speed);
      this.autoPlayIntervals.push(intervalId);
      
      // Pause auto-play on user interaction
      slider.addEventListener('mouseenter', () => {
        isUserInteracting = true;
      });
      
      slider.addEventListener('mouseleave', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 250); // Resume after 0.25 seconds
      });
      
      // Pause on touch/drag
      slider.addEventListener('mousedown', () => {
        isUserInteracting = true;
      });
      
      slider.addEventListener('touchstart', () => {
        isUserInteracting = true;
      });
      
      // Resume after user stops interacting
      slider.addEventListener('mouseup', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 500); // Resume after 0.5 seconds
      });
      
      slider.addEventListener('touchend', () => {
        setTimeout(() => {
          isUserInteracting = false;
        }, 500); // Resume after 0.5 seconds
      });
    });
    
    // Clean up intervals when page unloads
    window.addEventListener('beforeunload', () => {
      this.autoPlayIntervals.forEach(interval => clearInterval(interval));
    });
  }

  // Initialize all slider functionality
  init() {
    this.renderProjectSliders();
    this.initializeDragSliders();
    this.initializeAutoPlay();
  }
}

// Create global instance
const projectSlider = new ProjectSlider();
