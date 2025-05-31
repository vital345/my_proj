import {Typography} from   '@mui/material';
import { GrScorecard } from "react-icons/gr";
import { MdPendingActions } from "react-icons/md";


import { LinkerResult } from "../pages/AdminDashBoard/MonitorResults/MonitorResultsPage"
export const UserResult=(props:LinkerResult)=>{
    return(
        <div style={{boxShadow:(props.grade==="pending"?"0.1rem 0.1rem grey":"0.2rem 0.2rem 0.1rem 0.1rem #007bff"),pointerEvents:(props.grade==="pending"?"none":"auto"),cursor:(props.grade==="pending"?"not-allowed":"pointer"),display:"flex",justifyContent:"space-evenly",backgroundColor:(props.grade==="pending"?"grey":"#333"),paddingInline:"3rem",paddingBlock:"1rem",width:"20rem",borderRadius:"0.5rem",alignItems:"center"}}>
            <Typography style={{width:"60%",}}>{props.email}</Typography>
            <Typography>{props.track}</Typography>

            {
                props.grade==="pending"?<MdPendingActions color='whitesmoke' />
                : <GrScorecard color='whitesmoke' />

            }


        </div>
    )
}