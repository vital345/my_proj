import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Collapse, CollapseProps } from "antd";
import { UserScreenVideoType } from "../../interfaces/VivaVoceDetails";

const ScreenRecordingComponent = ({
  userScreenVideos,
}: {
  userScreenVideos: UserScreenVideoType[];
}) => {
  const collapseItems = [
    {
      key: "1",
      label: "Download Screen Recordings",
      children: (
        <>
          <Table>
            <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
              <TableRow>
                <TableCell align="center">File Name</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userScreenVideos.map((item) => {
                return (
                  <TableRow>
                    <TableCell align="center">{item.filename}</TableCell>
                    <TableCell align="center">
                      <div
                        onClick={() => {
                          window.open(item.url, "_blank");
                        }}
                      >
                        <Button variant="contained">Download</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      ),
    },
  ] as CollapseProps["items"];

  return (
    !!userScreenVideos?.length && (
      <div style={{ marginBottom: "20px" }}>
        <Collapse items={collapseItems} />
      </div>
    )
  );
};

export default ScreenRecordingComponent;
