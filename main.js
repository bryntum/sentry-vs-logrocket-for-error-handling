import "./style.css";
import { Gantt, ProjectModel } from "@bryntum/gantt";
import "@bryntum/gantt/gantt.stockholm.css";

async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

const project = new ProjectModel({
  transport: {
    load: {
      url: "data/data.json",
    },
  },
});

project
  .load()
  .catch((error) => {
    console.error(error);
    Sentry.captureException(error);
  })
  .then(() => {
    // here data is loaded and processed by the engine
    console.log("Data loaded and processed...");
  });

const gantt = new Gantt({
  appendTo: document.body,
  project,
  columns: [{ type: "name", width: 250, text: "Tasks" }],
  tbar: {
    height: "4em",
    items: {
      addTaskButton: {
        color: "b-green",
        icon: "b-fa b-fa-plus",
        text: "Create",
        tooltip: "Create new task",
        onAction: "up.onAddTask",
      },
    },
  },

  async onAddTask() {
    const gantt = this,
      added = gantt.taskStore.rootNode.appendChild({
        name: this.L("New task"),
        duration: 1,
      });

    // run propagation to calculate new task fields
    // await gantt.project.commitAsync();
    // incorrect method name
    await gantt.project.comitAsync();

    // scroll to the added task
    await gantt.scrollRowIntoView(added);

    gantt.features.cellEdit.startEditing({
      record: added,
      field: "name",
    });
  },

  onPercentBarDrag({ taskRecord }) {
    if (taskRecord.percentDone === 100) {
      // send task complete notification to api using fetch
      postData("https://example.com/notifications/taskcomplete", {
        taskId: taskRecord.id,
      })
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          Sentry.captureException(error);
        });
    }
  },
});