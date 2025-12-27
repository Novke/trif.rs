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
        },

        // Virtual scroll settings
        virtualScroll: {
            maxOffset: 2000,       // Maximum virtual scroll distance
            sensitivity: 1.0       // Wheel sensitivity multiplier
        }
    };
    // ============================================

    // State
    let virtualScrollY = 0;
    let useVirtualScroll = false;

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

    // Update star positions based on scroll value
    function updateStarPositions(scrollValue) {
        for (let i = 1; i <= 5; i++) {
            const layer = document.getElementById(`star-layer-${i}`);
            if (layer) {
                layer.style.transform = `translateY(${-scrollValue * CONFIG.parallax[`layer${i}`]}px)`;
            }
        }
    }

    // Parallax scroll handler (real scroll)
    function setupRealScrollParallax() {
        let ticking = false;

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateStarPositions(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll);
        updateStarPositions(window.scrollY);
    }

    // Virtual scroll handler (wheel event, no page scroll)
    function setupVirtualScrollParallax() {
        let ticking = false;

        function onWheel(e) {
            // Update virtual scroll position
            virtualScrollY += e.deltaY * CONFIG.virtualScroll.sensitivity;

            // Clamp to bounds (allow scrolling in both directions)
            virtualScrollY = Math.max(0, Math.min(CONFIG.virtualScroll.maxOffset, virtualScrollY));

            if (!ticking) {
                requestAnimationFrame(() => {
                    updateStarPositions(virtualScrollY);
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('wheel', onWheel, { passive: true });
        updateStarPositions(0);
    }

    // Combined scroll - content scrolls normally, stars also respond to wheel beyond content
    function setupCombinedScrollParallax() {
        let ticking = false;

        function getEffectiveScroll() {
            // Use real scroll position, but also allow virtual extension
            const realScroll = window.scrollY;
            const maxRealScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);

            // If at bottom, add virtual scroll
            if (realScroll >= maxRealScroll - 5) {
                return realScroll + virtualScrollY;
            }

            // Reset virtual scroll when not at bottom
            virtualScrollY = 0;
            return realScroll;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateStarPositions(getEffectiveScroll());
                    ticking = false;
                });
                ticking = true;
            }
        }

        function onWheel(e) {
            const maxRealScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);

            // Check if content is scrollable
            if (maxRealScroll > 5) {
                // Content is scrollable - only use virtual scroll at bottom
                if (window.scrollY >= maxRealScroll - 5 && e.deltaY > 0) {
                    virtualScrollY += e.deltaY * CONFIG.virtualScroll.sensitivity;
                    virtualScrollY = Math.min(CONFIG.virtualScroll.maxOffset, virtualScrollY);
                } else if (virtualScrollY > 0 && e.deltaY < 0) {
                    // Scrolling up while in virtual scroll zone
                    virtualScrollY += e.deltaY * CONFIG.virtualScroll.sensitivity;
                    virtualScrollY = Math.max(0, virtualScrollY);
                    if (virtualScrollY > 0) {
                        e.preventDefault();
                    }
                }
            } else {
                // No content scroll - pure virtual scroll
                virtualScrollY += e.deltaY * CONFIG.virtualScroll.sensitivity;
                virtualScrollY = Math.max(0, Math.min(CONFIG.virtualScroll.maxOffset, virtualScrollY));
            }

            if (!ticking) {
                requestAnimationFrame(() => {
                    updateStarPositions(getEffectiveScroll());
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll);
        window.addEventListener('wheel', onWheel, { passive: false });
        updateStarPositions(0);
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

    // Initialize stars
    function init(options = {}) {
        const {
            scrollable = true,
            virtualScroll = false  // true = stars scroll even if content doesn't
        } = options;

        useVirtualScroll = virtualScroll;

        // Create stars when DOM is ready
        function setup() {
            createStarBackground();

            if (virtualScroll) {
                // Virtual scroll mode - stars always respond, content may or may not scroll
                setupCombinedScrollParallax();
            } else {
                // Normal mode - stars only respond to real scroll
                setupRealScrollParallax();
            }

            if (!scrollable) {
                disableScroll();
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    // Expose API
    window.StarBackground = {
        init: init,
        enableScroll: enableScroll,
        disableScroll: disableScroll,
        CONFIG: CONFIG
    };
})();
