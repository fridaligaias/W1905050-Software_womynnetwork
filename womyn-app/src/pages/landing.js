export function renderLanding(root) {
    root.innerHTML = `
    <div class="landing-container">
        
        <nav class="landing-nav-bar">
            <div class="logo-text" style="font-size: 1.9rem;">womyn</div>
            <div class="landing-nav-actions">
                <a href="#/login" class="landing-nav-btn landing-nav-btn-secondary">Log In</a>
                <a href="#/signup" class="landing-nav-btn landing-nav-btn-primary">Sign Up</a>
            </div>
        </nav>

        <header class="hero-section">
            <h1 class="hero-headline">Social networking,<br>for <em>women</em>.</h1>
            <p class="hero-subtext">
                An invite-only, women-only web app.<br>
                <strong>Private by design. Anonymous by choice.</strong><br>
                Safe & authentic connections in our corner of the internet.
            </p>
            <div class="hero-cta-wrapper">
                <a href="#/signup" class="auth-btn hero-btn">Join the Myns</a>
                <span style="font-size: 0.9rem; color: #666; margin-top: 10px; display: block;">You must have an invite code at signup.</span>
            </div>
        </header>

        <section class="section-wrapper">
            <div class="value-grid">
                <div class="value-card glass-panel">
                <div class="icon-circle">🌐</div>
                <h3>The Problem</h3>
                <p> 
                It is a <strong>fact</strong> that as women, we are disproportionately targeted by online harassment, data theft, and image misuse. 
                <br><strong>48%</strong> of women abandoned platforms due to feeling unsafe (Uplevyl, 2025).
                Tired of putting up with toxic environments and exploitative platforms? Sign up today! 
                </p>
                </div>
                <div class="value-card glass-panel">
                    <div class="icon-circle">🔒</div>
                    <h3>Privacy First Identity</h3>
                    <p>
                        Womyn separates your real identity from your online presence. 
                        Sign up with a unique username, nothing else is required!<br>
                    </p>
                </div>
                <div class="value-card glass-panel">
                    <div class="icon-circle">👾</div>
                    <h3>Safe Sharing</h3>
                    <p>
                    Your photos belong to you, not an AI training set or malicious actors. 
                    Womyn's <strong>adversarial filter</strong> applies a "dazzle" pattern
                    to your images to confuse recognition algorithms (CNNs).</p>
                </div>
                <div class="value-card glass-panel">
                <div class="icon-circle">🤝</div>
                    <h3>Authentic Connections</h3>
                    <p>
                        The Myn network is designed to foster genuine interactions. 
                        No ads and no marketing algorithms.
                        <br>Womyn is not about discrimination or separation: Womyn provides an alternative approach to social media for women who want to find an interactive, engaging, and safe space online.
                    </p>
                    </div>

            </div>
        </section>

        <section class="section-wrapper alt-bg">
            <div class="content-limit">
                <h2 class="section-title">How Access Works</h2>
                <div class="steps-container">
                    <div class="step-item">
                        <div class="step-number">01</div>
                        <h4>Secure an Invite</h4>
                        <p>Womyn is invite-only to ensure safety and comfort.</p>
                    </div>
                    <div class="step-item">
                        <div class="step-number">02</div>
                        <h4>Choose Your Username</h4>
                        <p>Create a unique handle. No phone numbers, emails, or real names are required to join. Stuck on an username? No problem, Womyn can generate some for you to choose from!</p>
                    </div>
                    <div class="step-item">
                        <div class="step-number">03</div>
                        <h4>Become a Myn</h4>
                        <p>Access the feed, pin your favorite posts and discussions, most importantly... make new friends!</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section-wrapper">
            <div class="content-limit text-center">
                <h2 class="section-title">Safety & Ethics</h2>
                <p class="body-text-large">
                Womyn aims to disrupt data, image theft and abuse by employing adversarial image processing. Nobody should have their photos used without consent.
                <br>
                This app prioritises women's agency.
            </div>
        </section>

        <section class="section-wrapper">
            <div class="about-box glass-panel">
                <div class="about-content">
                    <h2 class="section-title" style="margin-top:0;">About the Project</h2>
                    <p>
                        Womyn is a prototype for a safer internet. It is designed to explore what social media 
                        could look like if user agency and privacy were the foundational pillars, rather than afterthoughts behind profit and exploitation/ignoring bad actors.
                    </p>
                </div>
            </div>
        </section>

        <footer class="landing-footer">
            <div class="footer-content">
                <div class="logo-text" style="font-size: 1.5rem;">womyn</div>
                <div class="copyright">
                    &copy; w1905050 Fridali Gaias
                </div>
            </div>
        </footer>

    </div>
    `;
}
