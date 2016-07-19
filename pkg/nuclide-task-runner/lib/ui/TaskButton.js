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
import type {Option} from '../../../nuclide-ui/lib/SplitButtonDropdown';

import {Button, ButtonSizes} from '../../../nuclide-ui/lib/Button';
import {SplitButtonDropdown} from '../../../nuclide-ui/lib/SplitButtonDropdown';
import {TaskRunnerButton} from './TaskRunnerButton';
import {React} from 'react-for-atom';

type Props = {
  activeTask: ?AnnotatedTask,
  getActiveTaskRunnerIcon: () => ?ReactClass<any>,
  taskRunnerInfo: Array<TaskRunnerInfo>,
  runTask: (taskId?: TaskId) => void,
  selectTask: (taskId: TaskId) => void,
  taskIsRunning: boolean,
  tasks: Map<string, Array<AnnotatedTask>>,
};

export function TaskButton(props: Props): React.Element<any> {
  const confirmDisabled = props.taskIsRunning || !props.activeTask || !props.activeTask.enabled;
  const run = () => {
    if (props.activeTask != null) {
      props.runTask(props.activeTask);
    }
  };

  const {activeTask} = props;
  const taskRunnerInfo = props.taskRunnerInfo.slice().sort((a, b) => abcSort(a.name, b.name));
  const taskOptions = getTaskOptions(props.tasks, taskRunnerInfo);

  const ActiveTaskRunnerIcon = props.getActiveTaskRunnerIcon && props.getActiveTaskRunnerIcon();
  const TaskRunnerIcon = ActiveTaskRunnerIcon != null
    ? ActiveTaskRunnerIcon
    : () => <div>{activeTask && activeTask.taskRunnerName}</div>;

  // If we don't have an active task runner, use a generic button. If we do, use a fancy one that
  // shows its icon.
  const ButtonComponent = activeTask == null
    ? buttonProps => <Button {...buttonProps}>{buttonProps.children}</Button>
    : buttonProps => <TaskRunnerButton {...buttonProps} iconComponent={TaskRunnerIcon} />;

  // If there's only one task runner, and it doesn't have multiple tasks, don't bother showing the
  // dropdown.
  const taskCount = Array.from(props.tasks.values()).reduce((n, tasks) => n + tasks.length, 0);
  if (props.tasks.size <= 1 && taskCount <= 1) {
    // If there's no active task, just show "Run" (but have it disabled). It's just less weird than
    // some kind of placeholder. The parent component (Toolbar) will explain the situation.
    return (
      <ButtonComponent
        size={ButtonSizes.SMALL}
        disabled={confirmDisabled}
        icon={activeTask == null ? 'triangle-right' : activeTask.icon}
        onClick={run}>
        {activeTask == null ? 'Run' : activeTask.label}
      </ButtonComponent>
    );
  }

  return (
    <SplitButtonDropdown
      buttonComponent={ButtonComponent}
      value={props.activeTask}
      options={taskOptions}
      onChange={value => { props.selectTask(value); }}
      onConfirm={run}
      confirmDisabled={confirmDisabled}
      changeDisabled={props.taskIsRunning}
      size={ButtonSizes.SMALL}
    />
  );
}

const abcSort = (a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1);
const indent = label => `   ${label}`;

function getTaskOptions(
  tasks: Map<string, Array<AnnotatedTask>>,
  taskRunnerInfo: Array<TaskRunnerInfo>,
): Array<Option<mixed>> {
  const taskOptions = [];
  const tasklessRunners = [];
  let hasRelevantTasks = false;

  // Since we have some fake options, we need a value for them that could never be possible (so they
  // never appear selected).
  const NO_VALUE = {};

  // Add a block for each task runner.
  taskRunnerInfo.forEach(info => {
    const taskRunnerName = info.name;
    const tasksForRunner = tasks.get(info.id) || [];
    if (tasksForRunner.length === 0) {
      tasklessRunners.push(taskRunnerName);
      return;
    }
    hasRelevantTasks = true;
    taskOptions.push({
      value: NO_VALUE,
      label: taskRunnerName,
      disabled: true,
    });
    taskOptions.push(
      ...tasksForRunner.map(task => ({
        value: task,
        label: indent(task.label),
        selectedLabel: task.label,
        icon: task.icon,
      })),
    );
  });

  // Add a section for runners without active tasks.
  if (tasklessRunners.length > 0) {
    if (hasRelevantTasks) {
      taskOptions.push({type: 'separator'});
    }
    taskOptions.push({
      value: NO_VALUE,
      label: 'Waiting for tasks from:',
      disabled: true,
    });
    tasklessRunners.forEach(name => {
      taskOptions.push({
        value: NO_VALUE,
        label: indent(name),
        disabled: true,
      });
    });
  }

  return taskOptions;
}
