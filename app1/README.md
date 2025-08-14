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