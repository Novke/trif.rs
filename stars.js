/**
 * Star Background System
 * Generates parallax star layers with twinkle and drift effects
 */
(function() {
    'use strict';

    // ============================================
    // CONFIGURATION - Edit these values easily
    // ============================================
    const CONFIG = {
        // Parallax speeds (higher = faster movement when scrolling)
        parallax: {
            layer1: 1.0,   // Closest layer - moves fastest
            layer2: 0.7,
            layer3: 0.45,  // Middle layer
            layer4: 0.25,
            layer5: 0.10   // Farthest layer - moves slowest
        },

        // Star counts per layer
        starCount: {
            layer1: 30,    // Fewer big stars (closest)
            layer2: 60,
            layer3: 100,   // Middle layer
            layer4: 180,
            layer5: 300    // Many small distant stars
        },

        // Star behavior percentages (0.0 to 1.0)
        effects: {
            twinkleChance: 0.30,   // 30% of stars twinkle
            driftChance: 0.40      // 40% of stars drift left/right
        },

        // Twinkle animation settings
        twinkle: {
            durationMin: 2,        // Minimum seconds
            durationMax: 5,        // Maximum seconds
            delayMax: 5            // Maximum delay before starting
        },

        // Drift animation settings
        drift: {
            durationMin: 8,        // Minimum seconds for one drift cycle
            durationMax: 20,       // Maximum seconds
            delayMax: 5            // Maximum delay before starting
        }
    };
    // ============================================

    // Generate random stars for a layer
    function generateStars(layer, count) {
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';

            // Random position across the layer
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';

            // Slight size variation
            const sizeVariation = 0.5 + Math.random() * 1;
            star.style.transform = `scale(${sizeVariation})`;

            // Twinkle effect based on CONFIG
            if (Math.random() < CONFIG.effects.twinkleChance) {
                const twinkleDuration = CONFIG.twinkle.durationMin + Math.random() * (CONFIG.twinkle.durationMax - CONFIG.twinkle.durationMin);
                star.style.animation = `twinkle ${twinkleDuration}s infinite`;
                star.style.animationDelay = Math.random() * CONFIG.twinkle.delayMax + 's';
            }

            // Drifting stars based on CONFIG
            if (Math.random() < CONFIG.effects.driftChance) {
                const driftAnimations = ['driftLeft', 'driftRight', 'driftWave', 'driftDiagonal'];
                const randomDrift = driftAnimations[Math.floor(Math.random() * driftAnimations.length)];
                const driftDuration = CONFIG.drift.durationMin + Math.random() * (CONFIG.drift.durationMax - CONFIG.drift.durationMin);
                const driftDelay = Math.random() * CONFIG.drift.delayMax;

                // Combine with existing animation or set new one
                if (star.style.animation) {
                    star.style.animation += `, ${randomDrift} ${driftDuration}s ease-in-out ${driftDelay}s infinite`;
                } else {
                    star.style.animation = `${randomDrift} ${driftDuration}s ease-in-out ${driftDelay}s infinite`;
                }
            }

            layer.appendChild(star);
        }
    }

    // Create star container and layers
    function createStarBackground() {
        // Create container
        const container = document.createElement('div');
        container.className = 'star-container';
        container.id = 'star-container';

        // Create 5 layers (farthest to closest)
        for (let i = 5; i >= 1; i--) {
            const layer = document.createElement('div');
            layer.className = `star-layer star-layer-${i}`;
            layer.id = `star-layer-${i}`;
            container.appendChild(layer);
        }

        // Insert as first child of body
        document.body.insertBefore(container, document.body.firstChild);

        // Generate stars for each layer
        for (let i = 1; i <= 5; i++) {
            const layer = document.getElementById(`star-layer-${i}`);
            generateStars(layer, CONFIG.starCount[`layer${i}`]);
        }
    }

    // Parallax scroll handler
    function setupParallax() {
        let ticking = false;

        function updateParallax() {
            const scrollY = window.scrollY;

            for (let i = 1; i <= 5; i++) {
                const layer = document.getElementById(`star-layer-${i}`);
                if (layer) {
                    layer.style.transform = `translateY(${-scrollY * CONFIG.parallax[`layer${i}`]}px)`;
                }
            }

            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });

        // Initial call
        updateParallax();
    }

    // Disable scrolling (for intro)
    function disableScroll() {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    // Enable scrolling
    function enableScroll() {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    // Force minimum scroll height for parallax effect
    function ensureScrollableHeight(minScreens = 3) {
        const minHeight = window.innerHeight * minScreens;
        const currentHeight = document.body.scrollHeight;

        if (currentHeight < minHeight) {
            // Add spacer div at the end
            let spacer = document.getElementById('star-scroll-spacer');
            if (!spacer) {
                spacer = document.createElement('div');
                spacer.id = 'star-scroll-spacer';
                spacer.style.pointerEvents = 'none';
                document.body.appendChild(spacer);
            }
            spacer.style.height = (minHeight - currentHeight) + 'px';
        }
    }

    // Initialize stars
    function init(options = {}) {
        const { scrollable = true, minScreens = 3 } = options;

        // Create stars when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createStarBackground();
                setupParallax();

                if (scrollable) {
                    enableScroll();
                    ensureScrollableHeight(minScreens);
                } else {
                    disableScroll();
                }
            });
        } else {
            createStarBackground();
            setupParallax();

            if (scrollable) {
                enableScroll();
                ensureScrollableHeight(minScreens);
            } else {
                disableScroll();
            }
        }
    }

    // Expose API
    window.StarBackground = {
        init: init,
        enableScroll: enableScroll,
        disableScroll: disableScroll,
        ensureScrollableHeight: ensureScrollableHeight,
        CONFIG: CONFIG
    };
})();
