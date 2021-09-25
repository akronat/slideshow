import React, { Component } from 'react';

import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';

const styles = ({ palette, spacing }: Theme) => createStyles({
  overlay: {
    border: 'dashed grey 4px',
    backgroundColor: 'rgba(255,255,255,.8)',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0, 
    right: 0,
    zIndex: 9999
  },
  overlayMessage: {
    position: 'absolute',
    top: '50%',
    right: 0,
    left: 0,
    textAlign: 'center',
    color: 'grey',
    fontSize: 36
  },
});

interface Props extends WithStyles<typeof styles> {
  className?: string;
  onDrop: (items: DataTransferItemList) => void;
};
interface State {
  dragging: boolean;
};
class DragAndDrop extends Component<Props, State> {
  dropRef: React.RefObject<HTMLDivElement> = React.createRef();
  dragCounter = 0;
  state: State = {
    dragging: false,
  };
  
  handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  handleDragIn = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter++;
    if (e.dataTransfer?.items?.length) {
      this.setState({dragging: true})
    }
  };

  handleDragOut = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.dragCounter--;
    if (this.dragCounter <= 0) {
      this.setState({ dragging: false });
    }
  };

  handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragging: false });
    if (e.dataTransfer?.items?.length) {
      this.props.onDrop(e.dataTransfer.items);
    }
    this.dragCounter = 0;
  };
  
  componentDidMount() {
    this.dragCounter = 0;
    let div = this.dropRef.current;
    if (div) {
      div.addEventListener('dragenter', this.handleDragIn)
      div.addEventListener('dragleave', this.handleDragOut)
      div.addEventListener('dragover', this.handleDrag)
      div.addEventListener('drop', this.handleDrop)
    }
  }
  
  componentWillUnmount() {
    let div = this.dropRef.current;
    if (div) {
      div.removeEventListener('dragenter', this.handleDragIn)
      div.removeEventListener('dragleave', this.handleDragOut)
      div.removeEventListener('dragover', this.handleDrag)
      div.removeEventListener('drop', this.handleDrop)
    }
  }

  render() {
    const { classes, className } = this.props;
    return (
      <div className={className} ref={this.dropRef}>
        {this.state.dragging && (
          <div className={classes.overlay}>
            <div className={classes.overlayMessage}>
              <div>drop here :)</div>
            </div>
          </div>
        )}
        {this.props.children}
      </div>
    )
  }
}

export default withStyles(styles)(DragAndDrop);
