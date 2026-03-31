describe('Test Setup', () => {
  it('should confirm Jest is working', () => {
    expect(true).toBe(true)
  })

  it('should have jest-dom matchers available', () => {
    const div = document.createElement('div')
    div.className = 'active'
    expect(div).toHaveClass('active')
  })
})
