# Metric Collection

The purpose of this markdown is to collect and aggregate the different metrics we would like to measure for analyzing different aspects of the Peribolos-as-a-Service.
These metrics should help us answer some of the questions like how many users are interacting with the app, what is the performance of the app etc.

The metrics are defined by the different personas. Based on the different personas different kinda metrics might be interesting.
We have listed the different personas in the following [subsection](#personas) and metrics that would be interesting based on these personas.

## Personas

-----------
This doc describes the different personas that are involved in Project Peribolos-as-a-Service.

### Product Owner

Project's key stakeholder who communicate the vision of the product to the team/stakeholders and ensure the feasibility of the product with respect to business objectives.

### Operations

Primarily focused on application management, application maintenance and instrumental in automation of application development processes.

### Technical Architect

Provides technical feasibility of requirements, advise on technology choices and manage the technical roadmap i.e. Team Comet members.

### Analyst

Work with both developers and users to assess the product, utilizing data and user feedback to suggest improvements. Responsible for analyzing metrics to continually improve the product i.e. Team Telescope members.

### Users

Users interacting with the product (who we are building the product for).

-----------

## Metrics Grouped by Personas

Based on the different personas involved in Project Peribolos-as-a-Service and identified [here](#personas), we can categorize the metrics as follows:

<table>
  <tr>
   <td><strong>Metrics</strong>
   </td>
   <td><strong>Metric Definition</strong>
   </td>
   <td><strong>Metric Calculation</strong>
   </td>
   <td><strong>Targeted Persona</strong>
   </td>
   <td><strong>Data Source</strong>
   </td>
  </tr>
  <tr>
   <td><strong># New users (daily/weekly/monthly)</strong>
   </td>
   <td>Number of new users over time
   </td>
   <td>
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>Product Adoption rate
</strong>
   </td>
   <td>How many people adopt the product and become regular users
   </td>
   <td>(New Users ÷ Total Users) * 100
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>User Retention Rate</strong>
   </td>
   <td>Rate of users retained over time
   </td>
   <td>(# Users end of given period)-(# New users acquired in the period) / (#Users in the beginning of the period) * 100
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>Daily/Monthly Active repos (DAU/MAU)</strong>
   </td>
   <td>Number of active repos daily/monthly
   </td>
   <td>
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>Product Stickiness Ratio</strong>
   </td>
   <td>Measures the number of people that are highly engaged with the product
   </td>
   <td>(DAU) / (MAU) * 100
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>Product Engagement Score (PES)</strong>
   </td>
   <td>How users are interacting with your product
   </td>
   <td>(Adoption + Retention + DAU/MAU) / 3 *100
   </td>
   <td>Product Owner
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td><strong>Customer Satisfaction Score (CSAT)</strong>
   </td>
   <td>How satisfied a customer/user is with overall experience of product
   </td>
   <td>User provides rating on a 1-5 level (1 unsatisfied, 5 highly satisfied) \
 \
Avg of 1-5 scores <strong>or</strong>
<p>
(# 4-5 scores)/(Total response volume) * 100
   </td>
   <td>Analyst
   </td>
   <td>Feedback Survey
   </td>
  </tr>
  <tr>
   <td><strong>Availability</strong>
   </td>
   <td>Probability that the product is operational at a given time
   </td>
   <td>(Time product is operating) / (total time it should be operating)
   </td>
   <td>Operations
   </td>
   <td>Prometheus
   </td>
  </tr>
  <tr>
   <td><strong>Avg Response Time</strong>
   </td>
   <td>Total time it takes to respond to a request for the app service
   </td>
   <td>(Total time taken to respond during the selected time period) / (# Responses in the selected time period)
   </td>
   <td>Operations
   </td>
   <td>Prometheus
   </td>
  </tr>
  <tr>
   <td><strong># API request per minute (RPM)</strong>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>Operations
   </td>
   <td>Prometheus
   </td>
  </tr>
  <tr>
   <td><strong>Success Rate per Action</strong>
   </td>
   <td>Success rate per action performed by the app
   </td>
   <td>(Success rate/per action)
   </td>
   <td> Operations
   </td>
   <td>Prometheus
   </td>
  </tr>
  <tr>
   <td><strong>Failure Rate per Action</strong>
   </td>
   <td>Failure rate per action performed by the app
   </td>
   <td>(Failure rate/per action)
   </td>
   <td> Operations
   </td>
   <td>Prometheus
   </td>
  </tr>
</table>
