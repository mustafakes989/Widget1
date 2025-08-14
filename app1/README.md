# app1

Spring Boot backend hosting the React task widget and APIs.

- People API: `GET /api/people`
- Create Task API: `POST /api/tasks`
- Widget bundle served from: `/static/widget/task-widget.js`

Run:

```
mvn spring-boot:run
```

Auth (Keycloak):

- Keycloak base: `http://localhost:8081`
- Configure issuer in `application.properties` via env var `KEYCLOAK_ISSUER_URI` or direct edit.
  - Default: `http://localhost:8081/realms/your-realm`
- All `/api/**` endpoints require a valid Bearer token (JWT).

Include from app2 (JSF + Spring Boot on http://localhost):

```xhtml
<!-- In template.xhtml -->
<script src="http://localhost:8080/static/widget/task-widget.js" defer></script>
<script>
  // Option A: if app2 initializes Keycloak JS adapter and sets window.keycloak
  // you can omit getToken and the widget will use window.keycloak.token automatically.

  // Option B: provide a token supplier using Keycloak JS adapter
  function getToken() {
    return new Promise(function(resolve, reject) {
      if (window.keycloak && typeof window.keycloak.updateToken === 'function') {
        window.keycloak.updateToken(30).then(function() {
          resolve(window.keycloak.token);
        }).catch(reject);
      } else {
        reject('keycloak not available');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    window.TaskWidget.mount({
      elementId: 'task-widget-container',
      // apiBaseUrl is optional since the widget infers http://localhost:8080 from its script src
      // apiBaseUrl: 'http://localhost:8080',
      // getToken: getToken, // optional if window.keycloak is available
      buttonText: 'Add Task',
      themeMode: 'light'
    });
  });
</script>
<div id="task-widget-container"></div>
```

If you cannot use the external script, ensure your reverse proxy serves `/static/widget/task-widget.js` from `http://localhost:8080`.

## Usage

- Load the script on the page where you want the widget:
  ```html
  <script src="http://localhost:8080/static/widget/task-widget.js" defer></script>
  ```
- Mount the widget:
  ```html
  <div id="task-widget-container"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      window.TaskWidget.mount({
        elementId: 'task-widget-container',
        // apiBaseUrl: 'http://localhost:8080', // optional; inferred from script origin
        // getToken: async () => { await window.keycloak.updateToken(30); return window.keycloak.token; },
        buttonText: 'Add Task',
        themeMode: 'light', // or 'dark'
        onCreated: function(task) { console.log('Created task', task); }
      });
    });
  </script>
  ```
- Mount options:
  - `elementId` or `element`: where to render the button and dialog. If omitted, a container is appended to `document.body`.
  - `apiBaseUrl`: base URL of app1 (defaults to the script origin, e.g. `http://localhost:8080`).
  - `getToken`: async supplier returning a Bearer JWT. Optional if `window.keycloak` is initialized; the widget will use it automatically.
  - `buttonText`: label for the launcher button. Default: `Add Task`.
  - `themeMode`: `'light' | 'dark'`. Default: `light`.
  - `onCreated(task)`: callback invoked after successful creation.

- Data sent on create (`POST /api/tasks`):
  ```json
  {
    "title": "My task",                 // required
    "descriptionHtml": "<p>rich text</p>",
    "priority": "LOW|MEDIUM|HIGH",
    "dueDate": "YYYY-MM-DD" ,           // nullable
    "assignedToId": "<personId>"        // nullable
  }
  ```
- People dropdown (`GET /api/people`) returns:
  ```json
  [ { "id": "1", "name": "Alice Johnson" }, ... ]
  ```

Notes:
- The widget injects React Quill styles from CDN (`react-quill` snow theme). If your CSP blocks it, host the CSS yourself or allow the CDN.
- APIs require a valid Keycloak access token accepted by app1's resource server (issuer `http://localhost:8081/realms/your-realm`).