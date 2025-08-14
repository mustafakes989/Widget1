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

- Configure issuer in `application.properties` via env var `KEYCLOAK_ISSUER_URI` or direct edit.
- All `/api/**` endpoints require a valid Bearer token (JWT).

Include from app2 (JSF + Spring Boot):

```xhtml
<!-- In template.xhtml -->
<h:outputScript name="widget/task-widget.js" library="external" target="body"/>
<script>
  // Option A: if your app2 already initializes Keycloak JS and sets window.keycloak
  // then you can omit getToken and the widget will use window.keycloak.token automatically.

  // Option B: provide a token supplier
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

  // Mount the widget into a container
  document.addEventListener('DOMContentLoaded', function() {
    // Provide the absolute API base URL for app1
    const apiBaseUrl = 'https://app1.example.com';
    window.TaskWidget.mount({
      elementId: 'task-widget-container',
      apiBaseUrl: apiBaseUrl,
      getToken: getToken, // or omit to use window.keycloak
      buttonText: 'Add Task',
      themeMode: 'light'
    });
  });
</script>
<div id="task-widget-container"></div>
```

If you cannot use `<h:outputScript>`, include directly:

```html
<script src="https://app1.example.com/static/widget/task-widget.js" defer></script>
```