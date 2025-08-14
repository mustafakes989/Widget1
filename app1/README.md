# app1

Spring Boot backend hosting the React task widget and APIs.

- People API: `GET /api/people`
- Create Task API: `POST /api/tasks`
- Widget bundle served from: `/static/widget/task-widget.js`

Run:

```
mvn spring-boot:run
```

Configure CORS for your app2 origin if needed in `CorsConfig`.