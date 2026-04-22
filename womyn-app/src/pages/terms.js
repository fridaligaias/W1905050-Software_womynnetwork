import { renderNavbar } from "../components/navbar";
import { renderRightColumn } from "../components/rightColumn";

export function renderTerms(root) {
    root.innerHTML = `
    <div class="container">
        <div class="left-col">${renderNavbar()}</div>

        <div class="center-col">
            <div class="feed-shell legal-shell">
                <a href="#/settings" class="legal-back-link">← Back to settings</a>

                <section class="legal-hero">
                    <p class="legal-eyebrow">Community Policy</p>
                    <h1 class="terms-title">Terms of Use</h1>
                    <p class="legal-lead">
                        womyn.network is a women-only platform built to center privacy, safety, trust,
                        and relaxed connection in a distinctly female digital space.
                    </p>
                </section>

                <section class="terms-section">
                    <h2>A Commitment to a Women-Only Space</h2>
                    <p>
                        womyn.network is a single-sex platform exclusively built for, and restricted to,
                        women, meaning adult human females. By joining the beta or signing up for the network,
                        users agree to uphold this boundary. This policy is not an afterthought. It is the
                        foundational pillar of the network's architecture and community guidelines.
                    </p>
                </section>

                <section class="terms-section">
                    <h2>Why This Rule Exists</h2>
                    <p>
                        The modern internet is frequently hostile to women. From disproportionate levels of
                        online harassment and deepfake exploitation to the chilling effect of male surveillance
                        in digital spaces, women navigate a distinctly different online landscape. We define
                        our user base strictly as women to provide a different kind of space: one free from
                        the usual expectations and dynamics, where users can feel relaxed and comfortable.
                    </p>
                </section>

                <section class="terms-section">
                    <h2>Why It Is Important</h2>
                    <p>
                        A dedicated single-sex space fosters a unique level of safety. It allows for
                        uninhibited discussion, vulnerable sharing, and authentic connection across topics
                        ranging from healthcare and career mentorship to personal safety, practical support,
                        or simply having a laugh. By protecting the front door, we protect the integrity of
                        the space itself.
                    </p>
                </section>

                <section class="terms-section">
                    <h2>Why It Is Lawful</h2>
                    <p>
                        Providing a single-sex service is a legally recognised and protected right when it
                        serves a clear, justifiable purpose. Under UK law, including the Equality Act 2010
                        exemptions for single-sex services, restricting a service to one sex can be lawful
                        when it is a proportionate means of achieving a legitimate aim.
                    </p>

                    <p>Our legitimate aims are explicitly clear:</p>

                    <ul class="legal-list">
                        <li>
                            <strong>Privacy and Decency:</strong> ensuring digital privacy and helping prevent
                            the non-consensual exploitation of female users.
                        </li>
                        <li>
                            <strong>Targeted Need:</strong> addressing the specific, documented need for
                            female-only digital safety tools and networking spaces.
                        </li>
                        <li>
                            <strong>Efficacy:</strong> providing a level of security and open communication
                            that would be demonstrably less effective in a mixed-sex provision.
                        </li>
                    </ul>

                    <p>
                        We stand by these aims in order to protect the integrity of womyn.network and the
                        women it was built to serve.
                    </p>
                </section>

                <footer class="terms-footer">
                    <p>
                        This page should be treated as product copy, not formal legal advice. Before public
                        launch, it is worth having the final wording reviewed by a qualified UK legal professional.
                    </p>
                </footer>
            </div>
        </div>

        <div class="right-col"></div>
    </div>
    `;

    renderRightColumn(root.querySelector(".right-col"));
}
