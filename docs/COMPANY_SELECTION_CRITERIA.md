# Company Selection Criteria

This document defines the selection criteria for companies included in the `SF AI startup map`.

It has three goals:

1. Keep the inclusion standard consistent
2. Include only verifiable information, not guesses
3. Make future additions follow the same rules

## Core Policy

This product is a curated map designed to make the SF AI scene easy to understand.

However, all listed information must be `source-backed only`.
That means vibe, rumors, presence on X, or YC listing alone are not enough.

Only companies that meet all of the following may appear on the public page:

1. They are `AI-native`, or AI is central to the business
2. Their presence in `San Francisco` can be verified through a public source
3. Their company name, official website, and location evidence can all be verified
4. Their category and description can be supported by public information rather than guesswork

Here, `AI-native` means AI is the core of the business itself, not just an added feature.

Examples:

1. `OpenAI` should be included
2. `Perplexity` should be included
3. `Scale AI` should be included
4. `Notion` should be excluded

Even if a company has AI features, like `Notion AI`, it should not be included unless the company itself is AI-native.

## Required Fields

The minimum required fields for including one company are:

1. `name`
2. `website`
3. `shortDescription`
4. `category`
5. `locationLabel`
6. `coordinates`
7. `founded`
8. `sourceUrl`
9. `sourceLabel`

Among these, the most important are `locationLabel`, `coordinates`, `sourceUrl`, and `sourceLabel`.

## Source Requirements

As a rule, location evidence must come from one of the following:

1. An official company information page on the official website
2. An official document such as a PDF, terms of service, privacy policy, or letterhead
3. A trusted company profile service's location page
4. A public source showing company location, such as an official registry or company database

Use the following source priority:

1. `official source`
2. `public company profile / registry`
3. `secondary source`

`Listed on YC`, `seen on X`, or `San Francisco` written in a job post is not enough on its own.
That is not considered reliable enough location data for placing a company on the map.

## Companies That Can Be Included

A company may be included only if it meets all of the following:

1. It is an AI company
2. It fits the current product context
3. Its SF presence can be verified through a public source
4. Its address or a sufficiently specific location can be verified
5. The map coordinates can be derived from that address

## Companies That Should Not Be Included

Do not include companies that match any of the following:

1. Companies whose SF presence can only be inferred
2. Companies that only say `San Francisco, CA` without a strong address or location source
3. Companies whose primary business is not AI
4. Clearly older large companies that fall outside the product's focus
5. Companies whose location, category, or description depends on guesswork
6. Companies that have AI features but are not themselves AI-native

## Companies to Hold

The following companies should be treated as `pending`, not excluded:

1. Companies you want to include, but whose location source is weak
2. Companies with an official website but no confirmed address yet
3. Companies that seem strongly connected to SF, but do not yet have enough public evidence

Pending companies should not be added to the public dataset.
If needed, manage them in a separate `pending` file or keep them commented out in code.

## Categorization Rules

Use the following fixed category set:

1. `Core Labs`
2. `Consumer AI`
3. `Devtools`
4. `Infra`
5. `Agents`
6. `Vertical AI`

Do not choose categories based on surface-level vibes.
Use the following to decide:

1. The homepage headline or top copy on the official site
2. The product description
3. The company profile description
4. The business description found in public sources

If the classification is debatable, choose the single primary category that is easiest for users to understand.
If it is still ambiguous, hold the company rather than publishing it.

## Location Rules

Coordinates on the map must always be created from a location that has been verified through a public source.

Allowed:

1. Geocode a public address into coordinates
2. Show the building address as `locationLabel`

Not allowed:

1. Place a company loosely based only on a neighborhood
2. Assign fake cluster coordinates by category
3. Put a company in SoMa or Mission Bay based on vibes from the company name

## Description Rules

`shortDescription` and `whyItMatters` should not be overly exaggerated.

Must do:

1. Stay consistent with official descriptions
2. Avoid overhyping
3. Avoid evaluative claims that cannot be stated confidently

Avoid:

1. `Important because it is going viral on X`
2. `Probably in SoMa`
3. `Obviously very current`

Prefer explanations that communicate the company's role in the product landscape, not just the surrounding vibe.

## Process for Adding Data

When adding a new company, always follow this order:

1. Confirm that the company is AI-native
2. Check the official website
3. Find a public source for the SF location
4. Geocode the address to get coordinates
5. Decide the category
6. Add `sourceUrl` and `sourceLabel`
7. Verify the result in the browser

If even one piece of information is ambiguous, do not publish it.

## Handling Existing Data

Even previously added data should be removed from the public dataset if any of the following are true:

1. The location source can no longer be found
2. The address was based on inference
3. The category was based on estimation
4. The company's main business was not actually AI

## Project Principle

For this map, confidence in the data matters more than increasing the company count.

Having 8 trustworthy companies is better than having 100 questionable ones.

Even if the number of listed companies grows in the future, the same principle should hold.
