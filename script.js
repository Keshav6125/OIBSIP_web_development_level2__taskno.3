class TodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("todoTasks")) || []
    this.taskIdCounter = Number.parseInt(localStorage.getItem("taskIdCounter")) || 1
    this.currentEditingTask = null
    this.taskToDelete = null

    this.initializeElements()
    this.bindEvents()
    this.renderTasks()
    this.updateStats()
  }

  initializeElements() {
    this.addTaskForm = document.getElementById("addTaskForm")
    this.taskInput = document.getElementById("taskInput")
    this.pendingList = document.getElementById("pendingList")
    this.completedList = document.getElementById("completedList")
    this.pendingEmpty = document.getElementById("pendingEmpty")
    this.completedEmpty = document.getElementById("completedEmpty")
    this.pendingCount = document.getElementById("pendingCount")
    this.completedCount = document.getElementById("completedCount")
    this.totalTasks = document.getElementById("totalTasks")
    this.pendingTasks = document.getElementById("pendingTasks")
    this.completedTasks = document.getElementById("completedTasks")
    this.deleteModal = document.getElementById("deleteModal")
    this.deleteTaskPreview = document.getElementById("deleteTaskPreview")
    this.confirmDelete = document.getElementById("confirmDelete")
    this.cancelDelete = document.getElementById("cancelDelete")
  }

  bindEvents() {
    this.addTaskForm.addEventListener("submit", (e) => this.handleAddTask(e))
    this.confirmDelete.addEventListener("click", () => this.confirmDeleteTask())
    this.cancelDelete.addEventListener("click", () => this.closeDeleteModal())
    this.deleteModal.addEventListener("click", (e) => {
      if (e.target === this.deleteModal) {
        this.closeDeleteModal()
      }
    })

    // Handle escape key for modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeDeleteModal()
        this.cancelEdit()
      }
    })
  }

  handleAddTask(e) {
    e.preventDefault()
    const taskText = this.taskInput.value.trim()

    if (taskText) {
      const newTask = {
        id: this.taskIdCounter++,
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      }

      this.tasks.push(newTask)
      this.saveToStorage()
      this.taskInput.value = ""
      this.renderTasks()
      this.updateStats()

      // Add a subtle animation to the input
      this.taskInput.style.transform = "scale(0.98)"
      setTimeout(() => {
        this.taskInput.style.transform = "scale(1)"
      }, 150)
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      task.completedAt = task.completed ? new Date().toISOString() : null
      this.saveToStorage()
      this.renderTasks()
      this.updateStats()
    }
  }

  editTask(taskId) {
    this.cancelEdit() // Cancel any existing edit
    this.currentEditingTask = taskId

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`)
    const taskText = taskElement.querySelector(".task-text")
    const editInput = taskElement.querySelector(".task-edit-input")
    const editBtn = taskElement.querySelector(".edit-btn")
    const deleteBtn = taskElement.querySelector(".delete-btn")

    taskText.classList.add("editing")
    editInput.classList.add("active")
    editInput.value = taskText.textContent
    editInput.focus()
    editInput.select()

    // Replace edit/delete buttons with save/cancel
    editBtn.textContent = "Save"
    editBtn.className = "action-btn save-btn"
    deleteBtn.textContent = "Cancel"
    deleteBtn.className = "action-btn cancel-btn"

    // Handle enter key to save
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.saveEdit(taskId)
      }
    })
  }

  saveEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`)
    const editInput = taskElement.querySelector(".task-edit-input")
    const newText = editInput.value.trim()

    if (newText) {
      const task = this.tasks.find((t) => t.id === taskId)
      if (task) {
        task.text = newText
        this.saveToStorage()
        this.renderTasks()
        this.updateStats()
      }
    }

    this.currentEditingTask = null
  }

  cancelEdit() {
    if (this.currentEditingTask) {
      this.renderTasks()
      this.currentEditingTask = null
    }
  }

  showDeleteModal(taskId) {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      this.taskToDelete = taskId
      this.deleteTaskPreview.textContent = task.text
      this.deleteModal.classList.add("active")
    }
  }

  closeDeleteModal() {
    this.deleteModal.classList.remove("active")
    this.taskToDelete = null
  }

  confirmDeleteTask() {
    if (this.taskToDelete) {
      this.tasks = this.tasks.filter((t) => t.id !== this.taskToDelete)
      this.saveToStorage()
      this.renderTasks()
      this.updateStats()
      this.closeDeleteModal()
    }
  }

  renderTasks() {
    const pendingTasks = this.tasks.filter((task) => !task.completed)
    const completedTasks = this.tasks.filter((task) => task.completed)

    this.renderTaskList(pendingTasks, this.pendingList, this.pendingEmpty)
    this.renderTaskList(completedTasks, this.completedList, this.completedEmpty)

    this.pendingCount.textContent = pendingTasks.length
    this.completedCount.textContent = completedTasks.length
  }

  renderTaskList(tasks, container, emptyState) {
    // Clear existing tasks (but keep empty state)
    const existingTasks = container.querySelectorAll(".task-item")
    existingTasks.forEach((task) => task.remove())

    if (tasks.length === 0) {
      emptyState.style.display = "block"
    } else {
      emptyState.style.display = "none"

      tasks.forEach((task) => {
        const taskElement = this.createTaskElement(task)
        container.appendChild(taskElement)
      })
    }
  }

  createTaskElement(task) {
    const taskDiv = document.createElement("div")
    taskDiv.className = `task-item ${task.completed ? "completed" : ""}`
    taskDiv.setAttribute("data-task-id", task.id)

    const isEditing = this.currentEditingTask === task.id

    taskDiv.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox ${task.completed ? "checked" : ""}" onclick="todoApp.toggleTask(${task.id})">
                    ${task.completed ? "✓" : ""}
                </div>
                <div class="task-content">
                    <div class="task-text ${task.completed ? "completed" : ""} ${isEditing ? "editing" : ""}">${task.text}</div>
                    <input type="text" class="task-edit-input ${isEditing ? "active" : ""}" value="${task.text}">
                </div>
                <div class="task-actions">
                    <button class="action-btn ${isEditing ? "save-btn" : "edit-btn"}" onclick="${isEditing ? `todoApp.saveEdit(${task.id})` : `todoApp.editTask(${task.id})`}">
                        ${isEditing ? "Save" : "Edit"}
                    </button>
                    <button class="action-btn ${isEditing ? "cancel-btn" : "delete-btn"}" onclick="${isEditing ? `todoApp.cancelEdit()` : `todoApp.showDeleteModal(${task.id})`}">
                        ${isEditing ? "Cancel" : "Delete"}
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <div class="task-date">
                    <span>Created: ${this.formatDate(task.createdAt)}</span>
                    ${task.completedAt ? `<span>Completed: ${this.formatDate(task.completedAt)}</span>` : ""}
                </div>
            </div>
        `

    return taskDiv
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  updateStats() {
    const total = this.tasks.length
    const pending = this.tasks.filter((task) => !task.completed).length
    const completed = this.tasks.filter((task) => task.completed).length

    this.totalTasks.textContent = total
    this.pendingTasks.textContent = pending
    this.completedTasks.textContent = completed

    // Add animation to stats
    ;[this.totalTasks, this.pendingTasks, this.completedTasks].forEach((element) => {
      element.style.transform = "scale(1.1)"
      setTimeout(() => {
        element.style.transform = "scale(1)"
      }, 200)
    })
  }

  saveToStorage() {
    localStorage.setItem("todoTasks", JSON.stringify(this.tasks))
    localStorage.setItem("taskIdCounter", this.taskIdCounter.toString())
  }

  // Utility method to clear all data (for testing)
  clearAllData() {
    if (confirm("Are you sure you want to clear all tasks? This cannot be undone.")) {
      this.tasks = []
      this.taskIdCounter = 1
      this.saveToStorage()
      this.renderTasks()
      this.updateStats()
    }
  }
}

// Initialize the app when the page loads
let todoApp
document.addEventListener("DOMContentLoaded", () => {
  todoApp = new TodoApp()
})

// Add some helpful keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to add task quickly
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    document.getElementById("taskInput").focus()
  }
})
