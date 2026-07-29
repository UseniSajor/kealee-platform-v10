import Link from 'next/link'

export default function MilestonePaySection() {
  return (
    <div className="sec-s" id="milestone-pay">
      <div className="sec-s-i">
        <div className="ey">Milestone pay &amp; escrow</div>
        <h2 className="h2">Your money does not move until you say so.</h2>
        <p className="sub">Eligible marketplace engagements may offer milestone-based payment protection. Provider, funding, release, fee, dispute, and approval terms are shown before enrollment.</p>

        <div className="mp-layout">
          {/* Visual */}
          <div className="mp-visual">
            <div className="mp-title">How your money moves</div>
            <div className="mp-step">
              <div className="mp-ico ico-lock">🔒</div>
              <div className="mp-step-body">
                <h5>Eligible project funded under the displayed payment terms</h5>
                <p>When payment protection is offered, the provider and account terms are identified before funds are collected.</p>
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
                <h5>Project complete — final review</h5>
                <p>Final release, retainage, and lien-waiver requirements follow the agreement accepted for that engagement.</p>
                <div className="rel">→ Project closed</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mp-content">
            <div className="mp-feat">
              <div className="mp-ficon">🔒</div>
              <div>
                <h4>Payment protection when explicitly enabled</h4>
                <p>Payment protection is available only for engagements that explicitly show it as enabled. Funding, release, fee, dispute, and approval terms are presented before enrollment.</p>
              </div>
            </div>
            <div className="mp-feat">
              <div className="mp-ficon">📄</div>
              <div>
                <h4>Lien-waiver workflow when included</h4>
                <p>The engagement terms identify any conditional or final lien-waiver requirements. Owners should confirm local requirements and retain appropriate legal advice.</p>
              </div>
            </div>
            <div className="mp-feat">
              <div className="mp-ficon">💰</div>
              <div>
                <h4>Retainage defined by agreement</h4>
                <p>Any holdback percentage, release condition, and punch-list process is stated in the project agreement.</p>
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
              <div className="tr"><span className="trn">Milestone payment protection</span><span className="trp">When offered</span></div>
              <div className="tr"><span className="trn">Custom contract</span><span className="trp">$999</span></div>
              <div className="tr"><span className="trn">Full legal package</span><span className="trp">$3,499</span></div>
            </div>
            <Link href="/marketplace?audience=developer" className="scta" style={{ marginTop: 4 }}>Explore the developer marketplace</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
