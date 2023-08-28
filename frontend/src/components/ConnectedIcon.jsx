import React, { Fragment } from "react";

const ColoredCircle = ({ color }) => {
  const styles = { backgroundColor: color };

  return color ? (
    <Fragment>
      <span className="colored-circle" style={styles} />
    </Fragment>
  ) : null;
};

export default ColoredCircle;
