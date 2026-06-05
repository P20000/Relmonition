# Engineering Specification: Scroll-Driven Narrative Landing Page

This specification details the structural, style, and programmatic animation requirements for the single-page, scroll-triggered Relmonition landing page. Implement this utilizing a pinned-viewport architecture to prevent layout thrashing and guarantee a locked 60 FPS animation sequence.

---

## **creation instruction**
- Create a new file for the landing page. It should show up at the very beginning of the loading of website instead of the "go page" ie, sign in/ sign up page. on clicking the icon in the nav bar inside the main application shall lead to the landing page without logging out of any account and on clicking the Go button shall directly lead to dashboard of that account. Same shall happen on signing out from any account but instead of signing out it should log out the user from the current account and then lead to the landing page.  

## 🎨 1. Global Layout & Theme Tokens

Ensure all elements strictly inherit from the application's premium dark violet color palette

## 🧭 2. Component Specification: Sticky Navigation Bar

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] Relmonition                           Features   About Me  [Go] │
└────────────────────────────────────────────────────────────────────────┘

```

### Layout Constraints

* **Positioning:** Fixed topmost (`position: fixed; top: 0; left: 0; width: 100%; z-index: 100;`). It must remain completely static during scroll actions.
* **Aesthetics:** High-blur glassmorphism (`backdrop-blur-md bg-[#09070F]/70 border-b border-white/5`).
* **Left Section:** Relmonition vector mark paired with typography tracking application aesthetics.
* **Right Section:** Flex container housing anchor navigation items:
1. `Features` link mapping directly via smooth scroll to `#features`.
2. `About Me` link mapping directly via smooth scroll to `#aboutme`.
3. **"Go" Action Button:** Distinctive call-to-action layout highlighting a clear plan of action. Styled with a solid accent fill, dynamic hover scale scaling, and a structural glow:
```tailwind
bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 active:scale-95 transition-all rounded-lg px-4 py-2 text-sm font-medium

```

```

## 🎭 3. Component Specification: Hero & Scroll-Trigger Timeline

Implement a single pinned wrapper section using **GSAP ScrollTrigger**. The section pins (`pin: true`) the viewport container while driving a multi-act timeline keyed strictly to the user's scroll percentage.


```

Timeline Sequence Overview:
0% Progress ─────────────────── 33% ─────────────────── 66% ─────────────────── 100% Progress
[Act I: Disconnect]    [Act II: Ingestion Bridge]    [Act III: Resolution]    [Unpin Canvas]

```

### Act I: The Emotional Disconnect (Scroll Progress: 0% — 33%)
*   **Initial State:** Canvas displays a dark viewport with a centralized, stationary, unlit grey/red Relmonition logo baseline.
*   **Boyfriend Reveal:** As the user scrolls down, a clean vector SVG representation of the Boyfriend slides/fades into the left field (red glow). Simultaneously, an adjacent text/emoji bubble fades in directly above: `🤨❓` (Confusion + Questioning Heart).
*   **Girlfriend Reveal:** Continuing down the timeline, a vector SVG representation of the Girlfriend slides/fades into the right field. Simultaneously, an adjacent text/emoji bubble fades in directly above: `😤❓` (Frustration/Anger + Questioning Heart).

### Act II: The Relmonition Bridge & Ingestion (Scroll Progress: 34% — 66%)
*   **Convergence Motion:** Further scroll triggers the Boyfriend and Girlfriend vectors to smoothly translate horizontally toward the center, closing the distance gap. Their active message bubbles transition to standard question marks (`???`).
*   **The Bridge Composition:** They halt flanking the center. The Relmonition Logo scales up slightly, shifting to a solid **Red Accent Fill**. It sits perfectly positioned between two distinct, red communication bubbles that flank it, with defined padding so the logo forms a literal visual "bridge" bridging the gap between them.
*   **Data Ingestion Sequence:** 
    *   Ghost text string elements (representing raw data lines/chat log text pieces) stream inward from both characters, dissolving directly into the core Relmonition logo frame.
    *   **While text enters:** Trigger a high-frequency CSS or SVG animation path rotation loop on the logo’s outer dotted stroke border (`stroke-dasharray`). Simultaneously, toggle an active neon external glow filter layer (`drop-shadow`).

### Act III: The Strategic Resolution (Scroll Progress: 67% — 100%)
*   **State Shift:** As ingestion terminates, the Relmonition logo smoothly morphs its color vector from **Red to Blue**, signaling complete data synthesis and structural security.
*   **Emotional Alignment:** The red tension communication bubbles instantly dissipate, replaced by matching text bubbles for both vectors displaying joyful expression configurations and pulsing hearts (`🥰💖`).
*   **Final Transformation:** The text bubbles morph cleanly into a single, unified heart emoji structure scaling proportionally for both characters, completing the narrative transition loop.
*   **Canvas Unpin:** Once the transformation locks, GSAP releases the scroll pin, allowing the user to seamlessly transition down the page into the remaining semantic layouts.

Integrating the infrastructure blueprint directly into the scroll narrative is a spectacular way to reveal the "engine under the hood." It bridges the gap between the emotional user experience and the deep engineering that powers it.

By continuing the scroll-driven path, the user transitions from a high-level application solution straight into a **visual DevOps timeline**, showing how Terraform, AWS, EKS, and Helm chart architecture come together to dynamically isolate a single multi-tenant application.

---

## 🛠️ Updated Engineering Specification Addendum

Add this section immediately following **Act III (Resolution)** in your `LandingPage.tsx` timeline.

```
Extended Timeline Sequence Architecture:
... Act III ───► Act IV: Terraform Core (AWS) ───► Act V: EKS Compute ───► Act VI: Helm Orchestration ───► Unpin

```

### 🌉 Act IV: Infrastructure Provisioning (Scroll Progress: 100% — 125%)

* **The Transition Line:** As the final heart emoji locks in place, a glowing, vertical **purple dotted SVG path** emerges from the bottom of the couple's viewport. The camera pans downward following this line into a fresh black canvas section.
* **Terraform & AWS Reveal:** A terminal block window mock-up fades in on the left displaying simulated running logs (`terraform apply - auto-approve`). On the right, a network map of basic AWS building blocks (VPC, Subnets, IGW) fades in.
* **Animation Hook:** The dotted path snakes its way through the AWS VPC framework as lines of declarative configuration code float up from the terminal window and dissolve into the AWS cloud nodes.

### ☸️ Act V: EKS Compute Engine Bootstrap (Scroll Progress: 126% — 150%)

* **The Transition Line:** The dotted line snakes further down, connecting the base AWS VPC to a newly materializing cluster emblem.
* **EKS Layer Activation:** The AWS infrastructure dims slightly, and a geometric **Amazon EKS Cluster Node Map** scales up in the center.
* **Animation Hook:** Multiple concentric glowing rings rotate around the EKS core, while minor compute icons (EC2 Managed Node Groups, Control Plane API) attach themselves to the node lines, signaling that the Kubernetes cluster is provisioned, stable, and listening for instructions.

### 📦 Act VI: Helm Chart Orchestration (Scroll Progress: 151% — 175%)

* **The Transition Line:** The path continues downward from the EKS cluster API, splitting neatly into a multi-branch parallel highway.
* **Helm Release Multi-Tenancy:** A visual package ship icon (Helm) drops into the frame. From it, distinct namespaces (`monitoring`, `tenant-p20000`) slide open as sub-compartments inside the EKS cluster grid.
* **Animation Hook:**
* In the `monitoring` block, we watch mini-blocks representing the Prometheus Operator, `ServiceMonitor`, and Grafana lock into place.
* In the `tenant` block, an atomic pod container maps itself inside the namespace grid. A text bubble pulses briefly above it: `:3001 API Active | :9464 Telemetry Streaming`.


* **The Climax Completion:** The dotted line reaches its final termination point at the base of this live application pod, glowing completely solid data-blue. The canvas unpins, releasing the scrolling view straight down into the standard "About Me" portfolio cards.

---

---

## 🧑‍💻 4. Component Specification: Portfolio ("About Me") Section

Mounted cleanly below the pinned layout layer at `#aboutme`. It features a highly scannable grid showcasing developer metadata:
*   **Layout Structure:** Equal height grid blocks matching the system dashboard cards (`bg-white/[0.03] border border-white/10 rounded-2xl p-6`).
*   **Actionable Portals:** Deep link entries tracking:
    1.  `GitHub Profile` URL link wrapper.
    2.  `LinkedIn Profile` URL link wrapper.
    3.  `Web Applications Showcase` portal grid displaying complementary active projects.
*   **Climax Asset:** Positions a beautifully rendered vector/image asset directly underneath the portfolio node displaying the couple standing together smiling, closing the visual narrative loop.

---

## 🥾 5. Component Specification: Fixed Footer Container

*   **Layout Constraints:** Standard full-width footer layout placed at the terminal absolute bottom boundary of the single-page interface.
*   **Contents:** Clean semantic typography mapping corporate copyright notices, terms of service access paths, and localized platform usage rights reserved declarations.

---

## 🔍 6. Technical Integrity & Verification Guardrails

To prevent layout thrashing and maintain 60 FPS performance, strictly adhere to these guidelines:
1.  **Do not animate layout-disrupting CSS properties:** Never animate properties like `width`, `height`, `top`, or `left`. Drive all vector transitions exclusively via hardware-accelerated transforms (`transform: translate3d()` and `scale()`).
2.  **Use Native Inline SVGs:** Embed the characters, logo, and text bubble elements as raw vector paths to ensure seamless scaling and direct CSS target manipulation.
3.  **Execute via Smooth Timeline Hooks:** Bundle all states under a single parent GSAP Timeline container bound directly to a singular ScrollTrigger layout component tracking the page element. Do not use separate, uncoordinated window scroll listeners.

```