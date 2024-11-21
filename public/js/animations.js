// Konfigurasi particles.js
particlesJS('particles-js',
  {
    "particles": {
      "number": {
        "value": 80,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#ffffff"
      },
      "shape": {
        "type": "circle"
      },
      "opacity": {
        "value": 0.5,
        "random": false
      },
      "size": {
        "value": 3,
        "random": true
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#ffffff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "repulse"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      }
    },
    "retina_detect": true
  }
);

// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
  // Animate form elements
  gsap.from('.glass', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out'
  });

  // Animate form fields dan button
  gsap.from('input, button[type="submit"]', {
    duration: 0.8,
    y: 20,
    opacity: 0,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.5,
    clearProps: 'all'
  });

  // Hover animation untuk button
  const button = document.querySelector('button[type="submit"]');
  
  button.addEventListener('mouseenter', () => {
    gsap.to(button, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out'
    });
  });

  button.addEventListener('mouseleave', () => {
    gsap.to(button, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
}); 