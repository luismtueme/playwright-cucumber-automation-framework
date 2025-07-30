# Example Feature File
# 
# This is a template feature file demonstrating the structure and syntax
# for writing Cucumber feature files. Replace with your actual application features.
# 
# @author Your Name
# @version 1.0.0
# @since 2024

@Example
Feature: Example Feature
  As a user
  I want to perform example actions
  So that I can demonstrate the framework

  @Smoke
  Scenario: Example scenario
    Given I navigate to the application
    When I perform an example action
    And I verify the expected result
    Then I should see the expected outcome

  @Regression
  Scenario: Another example scenario
    Given I am on the application page
    When I interact with a form
    And I submit the form
    Then I should receive a success message 