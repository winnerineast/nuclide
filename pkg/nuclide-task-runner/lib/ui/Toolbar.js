'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {AnnotatedTask, TaskId, TaskRunnerInfo} from '../types';

import {TaskButton} from './TaskButton';
import {ProgressBar} from './ProgressBar';
import {getTask} from '../getTask';
import {React} from 'react-for-atom';

type Props = {
  taskRunnerInfo: Array<TaskRunnerInfo>,
  getActiveTaskRunnerIcon: () => ?ReactClass<any>,
  getExtraUi: ?() => ReactClass<any>,
  progress: ?number,
  visible: boolean,
  runTask: (taskId?: TaskId) => void,
  activeTaskId: ?TaskId,
  selectTask: (taskId: TaskId) => void,
  stopTask: () => void,
  taskIsRunning: boolean,
  tasks: Map<string, Array<AnnotatedTask>>,
};

export class Toolbar extends React.Component {
  props: Props;

  _renderExtraUi(): ?React.Element<any> {
    if (this.props.activeTaskId) {
      const ExtraUi = this.props.getExtraUi && this.props.getExtraUi();
      return ExtraUi ? <ExtraUi activeTaskType={this.props.activeTaskId.type} /> : null;
    }
    const runnerCount = this.props.taskRunnerInfo.length;
    switch (runnerCount) {
      case 0:
        return <span>Please install and enable a task runner</span>;
      case 1:
        const runnerName = this.props.taskRunnerInfo[0].name;
        return <span>Waiting for tasks from {runnerName}...</span>;
      default:
        return <span>Waiting for tasks from {runnerCount} task runners...</span>;
    }
  }

  render(): ?React.Element<any> {
    if (!this.props.visible) {
      return null;
    }

    const activeTaskId = this.props.activeTaskId;
    const activeTask = activeTaskId == null
      ? null
      : getTask(activeTaskId, this.props.tasks);

    return (
      <div className="nuclide-task-runner-toolbar">
        <div className="nuclide-task-runner-toolbar-contents padded">
          <div className="inline-block">
            <TaskButton
              activeTask={activeTask}
              getActiveTaskRunnerIcon={this.props.getActiveTaskRunnerIcon}
              taskRunnerInfo={this.props.taskRunnerInfo}
              runTask={this.props.runTask}
              selectTask={this.props.selectTask}
              taskIsRunning={this.props.taskIsRunning}
              tasks={this.props.tasks}
            />
          </div>
          <div className="inline-block">
            <button
              className="btn btn-sm icon icon-primitive-square"
              disabled={!this.props.taskIsRunning || !activeTask || activeTask.cancelable === false}
              onClick={() => { this.props.stopTask(); }}
            />
          </div>
          {this._renderExtraUi()}
        </div>
        <ProgressBar
          progress={this.props.progress}
          visible={this.props.taskIsRunning}
        />
      </div>
    );
  }

}
