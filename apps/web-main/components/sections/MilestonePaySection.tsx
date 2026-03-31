import Link from 'next/link'

export default function MilestonePaySection() {
  return (
    <div className="sec-s" id="milestone-pay">
      <div className="sec-s-i">
        <div className="ey">Milestone pay &amp; escrow</div>
        <h2 className="h2">Your money does not move until you say so.</h2>
        <p className="sub">Every project funded through Kealee uses milestone-based escrow. Payments release when you approve completed work — not before.</p>

        <div className="mp-layout">
          {/* Visual */}
          <div className="mp-visual">
            <div className="mp-title">How your money moves</div>
            <div className="mp-step">
              <div className="mp-ico ico-lock">🔒</div>
              <div className="mp-step-body">
                <h5>Project funded — funds deposited to escrow</h5>
                <p>Your project budget is held in a secure escrow account. The contractor cannot access it.</p>
              </div>
            </div>
            <div className="mp-step">
              <div className="mp-ico ico-check">✓</div>
              <div className="mp-step-body">
                <h5>Milestone 1 complete — you review and approve</h5>
                <p>Contractor submits photos and pay application. You review and approve or flag an issue.</p>
                <div className="rel">→ Funds release to contractor</div>
              </div>
            </div>
            <div className="mp-step">
              <div className="mp-ico ico-check">✓</div>
              <div className="mp-step-body">
                <h5>Milestone 2, 3... — same process every time</h5>
                <p>Each milestone follows the same review cycle. Nothing moves without your sign-off.</p>
                <div className="rel">→ Funds release to contractor</div>
              </div>
            </div>
            <div className="mp-step">
              <div className="mp-ico ico-done">✓✓</div>
              <div className="mp-step-body">
                <h5>Project complete — final payment + lien waiver</h5>
                <p>Lien waiver collected automatically. Final 10% retainage released after punch list sign-off.</p>
                <div className="rel">→ Project closed</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mp-content">
            <div className="mp-feat">
              <div className="mp-ficon">🔒</div>
              <div>
                <h4>Escrow on every project</h4>
                <p>Project funds are held in escrow from day one. No payment leaves until you approve a milestone. Standard on all Kealee-coordinated projects at no extra cost.</p>
              </div>
            </div>
            <div className="mp-feat">
              <div className="mp-ficon">📄</div>
              <div>
                <h4>Lien waivers collected automatically</h4>
                <p>At each payment release, your contractor submits a conditional lien waiver. At final payment, an unconditional waiver is collected. Your property title stays clean.</p>
              </div>
            </div>
            <div className="mp-feat">
              <div className="mp-ficon">💰</div>
              <div>
                <h4>10% retainage until final sign-off</h4>
                <p>Standard 10% holdback on the final payment. Released after punch list is complete and you confirm the work is done to spec.</p>
              </div>
            </div>
            <div className="mp-feat">
              <div className="mp-ficon">⚖️</div>
              <div>
                <h4>Custom contract available</h4>
                <p>Platform terms cover standard projects. Add an attorney-reviewed custom contract with your specific scope, change order language, and dispute resolution for $999.</p>
              </div>
            </div>
            <div className="mp-tiers">
              <div className="tr"><span className="trn">Milestone pay &amp; escrow</span><span className="trp">Free with project</span></div>
              <div className="tr"><span className="trn">Custom contract</span><span className="trp">$999</span></div>
              <div className="tr"><span className="trn">Full legal package</span><span className="trp">$3,499</span></div>
            </div>
            <Link href="/developers#payments" className="scta" style={{ marginTop: 4 }}>Learn about payment protection</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
