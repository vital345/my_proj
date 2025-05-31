export interface MilestoneDetails {
    id: number,
    step_name: string,
    step_report: MilestoneStepReportDetails,
    userevaluation_id: number,
}

export interface MilestoneStepReportDetails {
    milestone_reports: MilestoneReport[],
    weights?:number[]   
}

export interface MilestoneReport {
    title: string
    status: string
    score: number
    feedback: string,
    
}