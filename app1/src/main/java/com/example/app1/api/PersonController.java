package com.example.app1.api;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(path = "/api/people", produces = MediaType.APPLICATION_JSON_VALUE)
public class PersonController {

	public record Person(String id, String name) {}

	@GetMapping
	public List<Person> listPeople() {
		return List.of(
			new Person("1", "Alice Johnson"),
			new Person("2", "Bob Smith"),
			new Person("3", "Charlie Diaz")
		);
	}
}