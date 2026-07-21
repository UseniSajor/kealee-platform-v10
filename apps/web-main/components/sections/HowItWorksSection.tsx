export default function HowItWorksSection() {
  return (
    <div className="sec" id="how-it-works">
      <div className="ey">How it works</div>
      <h2 className="h2">Five steps. You choose how many.</h2>
      <p className="sub">Start with Step 1 for $395. Stop at any point. Add services when your project needs them.</p>
      <div className="fw">
        <div className="fwst acc">
          <div className="fwn">1</div>
          <h4>Upload photos</h4>
          <p>Get a floor plan, zoning check, cost band, and permit scope the next day.</p>
          <div className="fwpr">$395</div>
        </div>
        <div className="fwst">
          <div className="fwn">2</div>
          <h4>Get your cost estimate</h4>
          <p>AI cost estimate. Add human review and RSMeans validation for $595.</p>
          <div className="fwpr">Free → $1,850</div>
        </div>
        <div className="fwst">
          <div className="fwn">3</div>
          <h4>We file your permit</h4>
          <p>We fill out the forms, submit to the right agency, and track it to approval.</p>
          <div className="fwpr">$149 → $5,500</div>
        </div>
        <div className="fwst">
          <div className="fwn">4</div>
          <h4>Pick a contractor</h4>
          <p>Matched bids from verified contractors. Escrow and custom contract included.</p>
          <div className="fwpr">Free → $2,499</div>
        </div>
        <div className="fwst">
          <div className="fwn">5</div>
          <h4>Build it</h4>
          <p>Monthly site inspections. Milestone sign-off. Pay apps reviewed. Closeout documented.</p>
          <div className="fwpr">Free → $2,950</div>
        </div>
      </div>
      <div className="ftot">
        <div className="ftpath">If you use all five paid services: $395 + $595 + $950 + $2,950</div>
        <div className="ftnum">Fully managed total: <span>$4,890</span></div>
        <div className="ftnote">Most homeowners and project owners use two or three services. The free tier handles the rest.</div>
      </div>
    </div>
  )
}
