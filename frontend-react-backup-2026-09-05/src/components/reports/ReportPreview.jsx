import Spinner from "../ui/Spinner.jsx";
import EmptyState from "../ui/EmptyState.jsx";

function buildDefectRows(report) {
  if (Array.isArray(report?.potholes)) {
    return report.potholes.map((pothole, index) => ({
      plate: `Evidence #${index + 1}`,
      defect_num: pothole.id,
      classification: 'Pothole / Asphalt Cavity',
      area_sqm: pothole.area_sqm,
      depth_cm: pothole.depth_cm,
      confidence: `${Math.round((pothole.confidence || 0) * 100)}%`,
      severity: pothole.severity,
      coords: `Lat: ${Number(pothole.coordinates?.lat || 0).toFixed(6)}, Lng: ${Number(pothole.coordinates?.lng || 0).toFixed(6)}`,
      repair_material: pothole.repair_material,
      snapshot_url: pothole.snapshot_url,
    }))
  }
  const rows = [];
  (report?.images || []).forEach((img, imgIdx) => {
    (img.bounding_boxes || []).forEach((b, bIdx) => {
      rows.push({
        plate: `Plate #${imgIdx + 1}`,
        defect_num: `D-${imgIdx + 1}.${bIdx + 1}`,
        classification: b.label || "Severe Pothole / Asphalt Cavity",
        area_cm2:
          b.area_cm2 || Math.round((b.width || 80) * (b.height || 60) * 0.05),
        confidence: b.confidence || "92%",
        coords: `X:${b.x ?? "--"} Y:${b.y ?? "--"}`,
      });
    });
  });
  return rows;
}

export default function ReportPreview({ status, report, onGenerate, onRetry }) {
  if (status === "loading") {
    return (
      <div className="flex min-h-[420px] flex-col rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <Spinner label="Loading report preview..." />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-p1/30 bg-p1/5 p-4 text-center shadow-card-sm">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-p1" />
        <p className="text-[13px] text-text-muted">
          This dossier could not be loaded.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white hover:bg-accent-blue-hover"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <EmptyState
          icon="fa-solid fa-file-circle-question"
          title="No Active Report Selected"
          message="Once inspection missions are processed, official certified reports will appear here."
          action={
            onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
              >
                <i className="fa-solid fa-file-circle-plus" /> Generate New
                Dossier
              </button>
            )
          }
        />
      </div>
    );
  }

  const summary = report.defects_summary || {
    total: 0,
    p1_high: 0,
    p2_medium: 0,
    p3_low: 0,
  };
  const allImages = (report.images || [])
    .map((im) => typeof im === 'string' ? im : im.image_url)
    .filter(Boolean);
  const defectRows = buildDefectRows(report);

  return (
    <div className="flex flex-col rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-teal/10 px-2.5 py-1 text-[11px] font-bold text-accent-teal">
            <i className="fa-solid fa-stamp" /> PE Certified
          </span>
          <span className="text-[12px] font-semibold text-text-muted">
            {report.report_number}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${report.overall_severity === 'High' ? 'bg-p1/15 text-p1' : report.overall_severity === 'Medium' ? 'bg-p2/15 text-p2' : 'bg-p3/15 text-p3'}`}>
            {report.overall_severity || report.overall_condition}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-bg-surface px-3.5 py-2 text-[12px] font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
          >
            <i className="fa-solid fa-print" /> Print Dossier
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
          >
            <i className="fa-solid fa-download" /> Download Official PDF
          </button>
        </div>
      </div>

      <div className="printable-report-sheet flex flex-col gap-5 text-text-primary">
        <div className="flex items-center gap-4 border-b-2 border-text-primary pb-4">
          <img
            src="/logo-aeropatch.png"
            alt="AeroPatch — Infrastructure Drone Solutions"
            className="h-12 w-auto shrink-0"
            width={1469}
            height={704}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-extrabold uppercase tracking-wide">
              Department of Transportation &amp; Infrastructure
            </h3>
            <p className="text-[11px] font-medium text-text-muted">
              AeroPatch Autonomous Drone Pavement Inspection Dossier
            </p>
          </div>
          <div className="shrink-0 rounded-sm border border-p1/40 px-2.5 py-1.5 text-center text-[10px] font-bold text-p1">
            <span className="block">CONFIDENTIAL</span>
            <strong>CIVIL AUDIT</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetaItem label="Asset Surveyed:" value={report.asset_name} />
          <MetaItem label="Mission ID:" value={report.mission_id} />
          <MetaItem label="Date of Flight:" value={report.generated_date} />
          <MetaItem label="Certifying Engineer:" value={report.inspector} />
        </div>

        <section>
          <h4 className="mb-1.5 text-[13px] font-bold">
            1. Executive Condition Assessment
          </h4>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            {report.executive_summary}
          </p>
        </section>

        {report.work_order_id && (
          <div className="rounded-sm border border-p1/40 bg-p1/5 px-3 py-2.5 text-[12px] text-p1">
            <strong><i className="fa-solid fa-triangle-exclamation mr-1.5" />CRITICAL ESCALATION: P1 Ticket Auto-Generated</strong>
            <span className="ml-2">Work order {report.work_order_id} is pending dispatch to Municipal Rapid Asphalt Unit.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricBox
            label="Health Score"
            value={report.health_score}
            tone="red"
          />
          <MetricBox label="Total Defects" value={summary.total} />
          <MetricBox label="Critical P1" value={summary.p1_high} tone="red" />
          <MetricBox
            label="Estimated Repair Budget"
            value={`$${(report.total_rehabilitation_cost || 0).toLocaleString()}`}
            tone="yellow"
          />
        </div>

        <section>
          <h4 className="mb-1.5 text-[13px] font-bold">
            2. Engineering Recommendations
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-text-secondary">
            {(report.recommendations || []).length > 0 ? (
              report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)
            ) : (
              <li>No recommendations logged.</li>
            )}
          </ul>
        </section>

        <section>
          <h4 className="mb-1 text-[13px] font-bold">
            3. Multi-Frame Aerial Photogrammetry Plates &amp; Defect Evidence
          </h4>
          <p className="mb-2.5 text-[11px] text-text-muted">
            Full photographic evidence captured during flight mission. All
            frames are georeferenced with computer vision bounding overlays.
          </p>
          {allImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-sm border border-border"
                >
                  <img
                    src={imgUrl}
                    alt={`Photolog Plate ${idx + 1}`}
                    className="h-28 w-full object-cover"
                  />
                  <div className="bg-bg-surface px-2 py-1.5 text-[10px]">
                    <strong className="block text-text-primary">
                      Aerial Photolog Plate #{idx + 1}
                    </strong>
                    <span className="text-text-muted">
                      Resolution: 4K UHD &bull; High Altitude Orthophoto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">
              No captured frames attached to this dossier.
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-1.5 text-[13px] font-bold">
            4. Consolidated Defect Inventory &amp; Engineering Schedule
          </h4>
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full min-w-[560px] text-left text-[12px]">
              <thead className="bg-bg-surface text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Frame</th>
                  <th className="px-3 py-2 font-semibold">Defect #</th>
                  <th className="px-3 py-2 font-semibold">Cavity Type</th>
                  <th className="px-3 py-2 font-semibold">Area / Depth</th>
                  <th className="px-3 py-2 font-semibold">Confidence</th>
                  <th className="px-3 py-2 font-semibold">Severity</th>
                  <th className="px-3 py-2 font-semibold">GPS Telemetry</th>
                  <th className="px-3 py-2 font-semibold">Repair Material</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {defectRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-text-muted"
                    >
                      No localized defect cavities logged on current flight
                      frames.
                    </td>
                  </tr>
                ) : (
                  defectRows.map((d, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-semibold">{d.plate}</td>
                      <td className="px-3 py-2 font-mono font-bold text-accent-blue">
                        {d.defect_num}
                      </td>
                      <td className="px-3 py-2">{d.classification}</td>
                      <td className="px-3 py-2 font-semibold">
                        {d.area_sqm != null ? `${d.area_sqm} m² / ${d.depth_cm} cm` : `${d.area_cm2} cm²`}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            parseInt(d.confidence, 10) > 85
                              ? "bg-p1/15 text-p1"
                              : "bg-p2/15 text-p2"
                          }`}
                        >
                          {d.confidence}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d.severity === 'High' ? 'bg-p1/15 text-p1' : d.severity === 'Medium' ? 'bg-p2/15 text-p2' : 'bg-p3/15 text-p3'}`}>{d.severity || 'Unclassified'}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-text-muted">
                        {d.coords}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">{d.repair_material || 'Field verification required'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h4 className="mb-1.5 text-[13px] font-bold">
            5. Issue Escalation &amp; Ticketing
          </h4>
          {(report.escalation_tickets || []).length === 0 ? (
            <p className="text-[12px] text-text-muted">
              No escalation tickets are currently linked to this asset.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full min-w-[560px] text-left text-[12px]">
                <thead className="bg-bg-surface text-text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Ticket ID</th>
                    <th className="px-3 py-2 font-semibold">Issue</th>
                    <th className="px-3 py-2 font-semibold">Severity</th>
                    <th className="px-3 py-2 font-semibold">Authority</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Maintenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.escalation_tickets.map((t) => (
                    <tr key={t.ticketId}>
                      <td className="px-3 py-2 font-mono font-bold text-accent-blue">
                        {t.ticketId}
                      </td>
                      <td className="px-3 py-2">{t.issueType}</td>
                      <td className="px-3 py-2">{t.severity}</td>
                      <td className="px-3 py-2">{t.authorityName}</td>
                      <td className="px-3 py-2">{t.status}</td>
                      <td className="px-3 py-2 font-mono text-text-muted">
                        {t.workOrderId || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5 text-[13px]">
      <span className="text-text-muted">{label}</span>
      <strong className="text-text-primary">{value}</strong>
    </div>
  );
}

function MetricBox({ label, value, tone }) {
  const toneClass =
    tone === "red"
      ? "text-p1"
      : tone === "yellow"
        ? "text-p2"
        : "text-text-primary";
  return (
    <div className="rounded-sm border border-border bg-bg-surface px-3 py-2.5 text-center">
      <span className="block text-[10px] font-semibold uppercase text-text-muted">
        {label}
      </span>
      <h3 className={`text-[18px] font-extrabold ${toneClass}`}>{value}</h3>
    </div>
  );
}
