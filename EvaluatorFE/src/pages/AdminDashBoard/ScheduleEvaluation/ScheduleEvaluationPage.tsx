// import { ProjectDescription } from "../../../components/ProjectDescption"
import { NavLink } from 'react-router-dom'
import './ScheduleEvaluationPage.css'
import { ScheduleForm } from '../../../components/ScheduleEvaluationFormComponent/ScheduleForm'

export const ScheduleEvaluationPage=()=>{
    return(
        <div style={{width:"100%",minHeight:"100vh",display:'flex',flexDirection:"column",backgroundColor:"#",paddingBlock:"2rem", alignItems: "center"}}>
            {/* <ProjectDescription /> */}
            <h1 className='schedule--header'>Schedule an Evaluation</h1>
            <nav className="schedule--navbar">
                <ul className="schedule--nav-items">
                    <li className="schedule--nav-item"><NavLink to={"#"}> Dashboard</NavLink></li>
                    <li className="schedule--nav-item"><NavLink to={"#"}> Evaluation</NavLink></li>
                    <li className="schedule--nav-item"><NavLink to={"#"} className="active"> Schedule Evaluation</NavLink></li>
                </ul>
            </nav>
            <ScheduleForm />
        </div>
    )
}