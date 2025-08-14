package com.example.app1.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping(path = "/api/tasks", produces = MediaType.APPLICATION_JSON_VALUE)
public class TaskController {

	public enum Priority { LOW, MEDIUM, HIGH }

	public record NewTaskRequest(
			@NotBlank String title,
			String descriptionHtml,
			@NotNull Priority priority,
			LocalDate dueDate,
			String assignedToId
	) {}

	public record TaskResponse(String id, String title) {}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
	public TaskResponse create(@RequestBody NewTaskRequest request) {
		// Persist task or perform business logic here. For demo, return a synthetic id.
		String id = "task-" + Math.abs(request.title().hashCode());
		return new TaskResponse(id, request.title());
	}
}