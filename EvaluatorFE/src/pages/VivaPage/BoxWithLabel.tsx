const OutlinedBox = ({
  label,
  children,
  containerClass,
}: {
  label: string;
  children: React.JSX.Element | (string | undefined);
  containerClass: string;
}) => {
  const fieldsetStyle = {
    // border: "0.25px solid #fff", // Adjust color, thickness, etc. to match your design
    borderRadius: "10px",
    padding: "20px", // Space for the content
    color: "#fff",
    // height: "111%"
  };

  const legendStyle = {
    fontSize: "20px",
    color: "#fff",
    // padding: "0 8px", // Spacing around text so it doesn’t overlap the border
  };

  return (
    <fieldset style={fieldsetStyle} className={containerClass}>
      <legend style={legendStyle}>{label}</legend>
      {children}
    </fieldset>
  );
};

export default OutlinedBox;
