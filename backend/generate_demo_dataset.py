"""
generate_demo_dataset.py
--------------------------
Regenerates the SYNTHETIC placeholder `master_dataset_final.csv` used by
this prototype when the real OIL dataset is not available.

NOTE: This is a placeholder/demo dataset generator only. It approximates
the scale (451 records) and source composition (411 "Industrial Safety
Dataset"-style + 40 "IOGP Fatal Incident Report"-style) described in the
problem brief, using generic, illustrative report text. It does NOT
reproduce OIL's real internal data or the real public source datasets.

Replace backend/data/master_dataset_final.csv with the real file whenever
it becomes available — no other code changes are needed, since all
analytics in this app are computed dynamically from whatever CSV is
present.

Run with:
    python generate_demo_dataset.py
"""

import csv
import random

random.seed(7)

LOCATIONS = [
    "Drill Site A", "Production Facility B", "Tank Farm C", "Pipeline ROW D",
    "Workshop E", "Gas Processing Plant F", "Loading Terminal G",
    "Well Pad H", "Electrical Substation I", "Site Yard J",
]

INDUSTRIAL_TEMPLATES = [
    "Worker entered a confined space without atmospheric testing.",
    "Technician entered a tank for cleaning without gas testing performed.",
    "Contractor accessed a vessel entry point without permit sign-off.",
    "Worker climbed into a manhole without confined space precautions.",
    "Maintenance worker performed welding without proper hot work controls.",
    "Contractor was grinding near flammable material without a hot work permit.",
    "Worker was cutting a pipe with a spark near open fuel containers.",
    "Welding activity carried out without a fire watch in place.",
    "Worker was exposed to an energized electrical panel.",
    "Technician opened a live electrical panel without lockout applied.",
    "Electrician worked on wiring without isolation confirmed.",
    "Worker touched an energised cable while performing routine maintenance.",
    "Employee was standing below a suspended crane load.",
    "Rigger was working under a suspended load during lifting operation.",
    "Worker was struck by a falling object near the lifting zone.",
    "Employee was caught between two pieces of moving equipment.",
    "Worker was operating in the line of fire of a pressurized hose.",
    "Vehicle driver was operating a vehicle on the site.",
    "Truck driver was found using a mobile phone while driving on the road.",
    "Employee drove a vehicle without a seatbelt during a site journey.",
    "Worker was found on a scaffold without fall protection.",
    "Employee was working at height on a roof without a harness.",
    "Worker used a ladder without securing it at the base.",
    "Technician replaced a light fixture using an unstable step ladder.",
    "Rigger performed a lifting operation using a damaged sling.",
    "Crane operator lifted a load without verifying the rigging inspection.",
    "Worker was operating a hoist without proper training.",
    "Employee reported a minor spill of hydraulic oil, cleaned up promptly.",
    "Worker noticed a loose guard rail and reported it before an incident occurred.",
    "Employee wore full PPE and followed procedure during routine inspection.",
    "Worker completed a toolbox talk before starting maintenance activity.",
    "Employee filled out routine paperwork in the office.",
    "Staff attended a safety training session in the conference room.",
    "Worker performed a routine walk-around inspection with no issues found.",
    "Employee reported a near miss involving a slippery floor in the corridor.",
    "Worker noticed an unmarked wet floor and placed a warning sign.",
    "Contractor entered a confined tank without informing the control room.",
    "Worker performed hot work near a chemical storage area without a permit.",
    "Employee bypassed the lockout tagout procedure to restart equipment quickly.",
    "Worker was seen without a hard hat near an overhead crane operation.",
    "Driver skipped the pre-trip vehicle inspection before a long site journey.",
    "Worker was exposed to chemical fumes due to a damaged ventilation system.",
    "Technician handled a corrosive chemical without required gloves.",
    "Worker was almost struck by a reversing truck in the yard.",
    "Employee reported inadequate guarding on a rotating machine part.",
    "Worker used an unguarded grinder causing sparks near flammable material.",
    "Crew performed a drilling operation on the rig floor without a permit review.",
    "Worker fell from a small height while descending stairs, minor injury.",
    "Employee slipped on an oil spill in the workshop, no injury reported.",
    "Worker reported a communication gap during shift handover on the drilling rig.",
    "Worker was struck by a dropped tool from an elevated platform.",
    "Object fell from scaffolding narrowly missing a worker below.",
    "Falling material from an overhead pipe rack caused a near miss.",
    "Worker inspected a pressure vessel without verifying isolation status.",
    "Technician was exposed to a sudden pressure release during valve maintenance.",
    "Worker handled hazardous chemicals without reviewing the safety data sheet.",
    "Employee reported strong fumes near the chemical storage tank.",
    "Contractor entered the site without completing the induction training.",
    "Worker performed maintenance on rotating equipment without isolation.",
    "Technician serviced a pump without confirming lockout tagout was applied.",
]

FATAL_INCIDENT_TEMPLATES = [
    "Worker was fatally injured after being struck by a falling drill pipe on the rig floor.",
    "A contractor died after entering an unventilated confined space and being overcome by toxic gas.",
    "A worker was fatally struck by a suspended load during a crane lifting operation.",
    "An employee was killed when caught between a rotating shaft and a fixed guard rail.",
    "A worker died after contact with an energized high-voltage electrical panel during maintenance.",
    "A fatality occurred when a worker fell from height while working on an unguarded platform.",
    "A worker was fatally injured in an explosion during hot work near a flammable atmosphere.",
    "A driver was killed in a vehicle rollover while transporting equipment on an unpaved road.",
    "A worker died after being pinned between a reversing vehicle and a loading dock structure.",
    "A fatal incident occurred when a pressurized line failed during maintenance, striking a worker.",
    "A worker was fatally injured after a scaffold collapse during construction activity.",
    "An employee died from asphyxiation after entering a tank without atmospheric testing.",
    "A fatality was recorded following a dropped object incident from an elevated work platform.",
    "A worker was killed when struck by a vehicle while working in the line of fire on the roadway.",
    "A contractor died after a lifting sling failed, causing the suspended load to fall.",
    "A worker was fatally electrocuted while performing unauthorized work on a live circuit.",
    "A fatal fall occurred when a worker's harness was not properly anchored at height.",
    "An employee was killed in a confined space incident during vessel cleaning operations.",
    "A worker died after being caught in rotating machinery during unguarded maintenance work.",
    "A fatality resulted from a gas release during a pressure testing operation on a pipeline.",
]

MODIFIERS = [
    "", " during night shift operations.", " while working alone without supervision.",
    " during a routine inspection.", " following a shift handover.",
    " under time pressure to complete the task.",
]


def build_records():
    records = []
    rid = 1
    industrial_count = 411
    fatal_count = 40

    for _ in range(industrial_count):
        base = random.choice(INDUSTRIAL_TEMPLATES)
        mod = random.choice(MODIFIERS)
        desc = (base + mod).strip()
        loc = random.choice(LOCATIONS)
        records.append({
            "report_id": f"R{rid:03d}",
            "description": desc,
            "location": loc,
            "source": "Industrial Safety Dataset",
        })
        rid += 1

    for _ in range(fatal_count):
        base = random.choice(FATAL_INCIDENT_TEMPLATES)
        loc = random.choice(LOCATIONS)
        records.append({
            "report_id": f"R{rid:03d}",
            "description": base,
            "location": loc,
            "source": "IOGP Fatal Incident Report",
        })
        rid += 1

    random.shuffle(records)
    for i, r in enumerate(records, start=1):
        r["report_id"] = f"R{i:03d}"

    return records


if __name__ == "__main__":
    records = build_records()
    assert len(records) == 451, len(records)

    with open("data/master_dataset_final.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["report_id", "description", "location", "source"])
        writer.writeheader()
        writer.writerows(records)

    print(f"Wrote {len(records)} demo records to data/master_dataset_final.csv")
