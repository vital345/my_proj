import { useEffect } from "react";
import "./index.css";
import { World } from "./index.helper";

const Render3DObjects = () => {
  useEffect(() => {
    new World();
  }, []);
  return (
    <div
      style={{ height: "100%", width: "100%", flex: "1" }}
      id={"render-3d-object"}
    ></div>
  );
};

export default Render3DObjects;
